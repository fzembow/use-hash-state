const buildURL = (path: string, hash: string): string =>
  `${path}#${hash}`;

const writeDataToURL = (
  stringData: string,
  pushHistoryState = false,
): void => {
  if (!window) {
    return;
  }

  const encodedData = encodeURIComponent(stringData);
  const url = buildURL(window.location.pathname, encodedData);
  const { title } = document;

  if (pushHistoryState) {
    window.history.pushState(undefined, title, url);
  } else {
    window.history.replaceState(undefined, title, url);
  }
};

export default writeDataToURL;
