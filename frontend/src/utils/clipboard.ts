export async function copyToClipboard(text: string): Promise<boolean> {
  // Use modern Clipboard API if available
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Clipboard API failed', err);
    }
  }

  // Fallback for HTTP (non-localhost) environments
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Move element out of view to avoid scrolling
    textArea.style.position = 'fixed';
    textArea.style.top = '-999999px';
    textArea.style.left = '-999999px';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    return successful;
  } catch (err) {
    console.error('Fallback clipboard failed', err);
    return false;
  }
}
