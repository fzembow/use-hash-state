const getRawDataFromURL = (): string | undefined => {
  if (!window) {
    return;
  }

  const hash = window.location.hash.slice(1);

  if (!hash) {
    return;
  }

  return decodeURIComponent(hash);
}

export default getRawDataFromURL;
