export const exportToCSV = (filename: string, rows: any[]) => {
  if (!rows || !rows.length) return;
  const separator = ",";
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    "\n" +
    rows
      .map((row) => {
        return keys
          .map((k) => {
            let cell = row[k] === null || row[k] === undefined ? "" : row[k];
            cell =
              cell instanceof Date
                ? cell.toLocaleString()
                : cell.toString().replace(/"/g, '""');
            if (cell.search(/("|,|\n)/g) >= 0) {
              cell = `"${cell}"`;
            }
            return cell;
          })
          .join(separator);
      })
      .join("\n");

  try {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  } catch {
    // Fallback for environments where blob downloads are blocked
    const win = window.open("", "_blank");
    if (win) win.document.write(`<pre>${csvContent.replace(/</g, "&lt;")}</pre>`);
  }
};

export const exportToJSON = (filename: string, data: any) => {
  try {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Revoke the object URL after a short delay to allow the download to start (B7)
    setTimeout(() => URL.revokeObjectURL(url), 100);
  } catch {
    // Fallback for Android WebViews and other environments that block blob downloads (B7)
    const json = JSON.stringify(data, null, 2);
    const win = window.open("", "_blank");
    if (win) win.document.write(`<pre>${json.replace(/</g, "&lt;")}</pre>`);
  }
};
