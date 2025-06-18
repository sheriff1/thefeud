export function preventNonNumeric(e: any) {
  // Allow: backspace, delete, tab, escape, enter, arrows
  if (
    [46, 8, 9, 27, 13, 110, 190].includes(e.keyCode) ||
    // Allow: Ctrl/cmd+A
    (e.keyCode === 65 && (e.ctrlKey || e.metaKey)) ||
    // Allow: Ctrl/cmd+C
    (e.keyCode === 67 && (e.ctrlKey || e.metaKey)) ||
    // Allow: Ctrl/cmd+V
    (e.keyCode === 86 && (e.ctrlKey || e.metaKey)) ||
    // Allow: home, end, left, right, up, down
    (e.keyCode >= 35 && e.keyCode <= 40)
  ) {
    return;
  }
  // Block: anything that's not a number
  if ((e.shiftKey || e.keyCode < 48 || e.keyCode > 57) && (e.keyCode < 96 || e.keyCode > 105)) {
    e.preventDefault();
  }
}
