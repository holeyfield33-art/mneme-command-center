import json
from pathlib import Path

CHECKPOINT_FILE = Path('/tmp/mneme_worker_state.json')


def save_checkpoint(task_id: str, step: str, context: dict):
    with CHECKPOINT_FILE.open('w', encoding='utf-8') as checkpoint_file:
        json.dump({'task_id': task_id, 'step': step, 'context': context}, checkpoint_file)


def load_checkpoint():
    if CHECKPOINT_FILE.exists():
        with CHECKPOINT_FILE.open('r', encoding='utf-8') as checkpoint_file:
            return json.load(checkpoint_file)
    return None


def clear_checkpoint():
    CHECKPOINT_FILE.unlink(missing_ok=True)
