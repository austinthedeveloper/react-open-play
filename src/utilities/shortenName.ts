const DEFAULT_MAX_LENGTH = 12;

const truncateWithEllipsis = (value: string, maxLength: number) => {
  if (value.length <= maxLength) {
    return value;
  }

  if (maxLength <= 2) {
    return value.slice(0, Math.max(1, maxLength));
  }

  return `${value.slice(0, maxLength - 2)}..`;
};

export const shortenName = (name: string, maxLength = DEFAULT_MAX_LENGTH) => {
  const trimmed = name.trim().replace(/\s+/g, " ");

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  const parts = trimmed.split(" ");
  if (parts.length < 2) {
    return truncateWithEllipsis(trimmed, maxLength);
  }

  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1].slice(0, 1);
  const firstPass = `${firstName} ${lastInitial}`;

  if (firstPass.length <= maxLength) {
    return firstPass;
  }

  const available = maxLength - 2;
  if (available < 3) {
    return `${firstName.slice(0, 1)}${lastInitial}`;
  }

  return `${truncateWithEllipsis(firstName, available)} ${lastInitial}`;
};
