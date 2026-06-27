export function launchQuickLook(usdzUrl: string) {
  // Apple Quick Look AR relies on an anchor tag with rel="ar"
  const a = document.createElement('a');
  a.setAttribute('rel', 'ar');
  a.setAttribute('href', usdzUrl);
  // An image inside the anchor is required by Safari for Quick Look
  const img = document.createElement('img');
  img.setAttribute('src', 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='); // Transparent pixel
  a.appendChild(img);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
