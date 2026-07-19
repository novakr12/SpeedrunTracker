export function toMessage(error: unknown): string {
  const message = (error as { error?: { message?: string | string[] } })?.error
    ?.message;
  if (Array.isArray(message)) {
    return message.join(', ');
  }
  return message ?? 'Request failed';
}
