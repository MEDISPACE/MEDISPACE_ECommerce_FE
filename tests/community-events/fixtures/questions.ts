export function questionPayload(overrides: Record<string, unknown> = {}) {
  return {
    content: `E2E question ${Date.now()} ${Math.floor(Math.random() * 100000)}`,
    ...overrides,
  }
}

export const questionStates = {
  pending: () => questionPayload({ content: `Pending question ${Date.now()}` }),
  approved: () => questionPayload({ content: `Approved question ${Date.now()}` }),
  hidden: () => questionPayload({ content: `Hidden question ${Date.now()} badword` }),
  answered: () => questionPayload({ content: `Answered question ${Date.now()}` }),
}
