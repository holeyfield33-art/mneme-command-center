import React, { useState, useEffect, useCallback } from 'react'
import { approvals, tasks } from '../api'
import ApprovalCard from '../components/ApprovalCard'

export default function Approvals() {
  const [approvalList, setApprovalList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [taskDetails, setTaskDetails] = useState({})

  const loadApprovals = useCallback(async () => {
    try {
      setError('')
      const response = await approvals.list('pending')
      setApprovalList(response.data)

      const uniqueTaskIds = [...new Set(response.data.map((approval) => approval.task_id))]
      const loadedTasks = await Promise.all(
        uniqueTaskIds.map(async (taskId) => {
          try {
            const taskRes = await tasks.get(taskId)
            return [taskId, taskRes.data]
          } catch (err) {
            console.error('Failed to load task', err)
            return null
          }
        })
      )

      const nextTaskDetails = {}
      loadedTasks.forEach((entry) => {
        if (entry) {
          nextTaskDetails[entry[0]] = entry[1]
        }
      })
      setTaskDetails(nextTaskDetails)
    } catch (err) {
      setError('Failed to load approvals')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadApprovals()
  }, [loadApprovals])

  useEffect(() => {
    const onSSE = () => {
      loadApprovals()
    }

    window.addEventListener('mneme:sse', onSSE)
    return () => window.removeEventListener('mneme:sse', onSSE)
  }, [loadApprovals])

  const handleApprove = async (approvalId) => {
    try {
      await approvals.approve(approvalId)
      loadApprovals()
    } catch (err) {
      setError('Failed to approve')
    }
  }

  const handleReject = async (approvalId) => {
    try {
      await approvals.reject(approvalId)
      loadApprovals()
    } catch (err) {
      setError('Failed to reject')
    }
  }

  const handleModify = (approvalId) => {
    const details = window.prompt('Add modification guidance for this approval:')
    if (!details) {
      return
    }
    setError(`Modification requested for ${approvalId}: ${details}`)
  }

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading...</div>
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Pending Approvals</h1>

      {error && <div style={{ color: 'red', marginBottom: '1rem', padding: '1rem', backgroundColor: '#ffe6e6', borderRadius: '4px' }}>{error}</div>}

      {approvalList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>No pending approvals</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {approvalList.map(approval => {
            const task = taskDetails[approval.task_id]
            return (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                task={task}
                onApprove={handleApprove}
                onReject={handleReject}
                onModify={handleModify}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
