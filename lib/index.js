/**
 * dsh-preview-snip — Host half.
 *
 * All work happens in the browser half: a preview-header action captures an
 * image/PDF region or a text selection and inserts it into the composer. The
 * Host needs no routes or services, so this entry only mounts the bundle.
 */
export const name = "preview-snip";
export const inject = [];

export function apply() {}
