// Phase D — request a filled GOV.UK PDF from the server and download it.
// Gated server-side behind payment (returns 402 if unpaid).
export async function downloadGeneratedForm(caseId: number, formType: string): Promise<void> {
  const res = await fetch(`/api/forms/${caseId}/generate/${formType}`, {
    method: "POST",
    credentials: "include",
    headers: { "X-Requested-With": "XMLHttpRequest" },
  });

  if (!res.ok) {
    let message = "Could not generate the form. Please try again.";
    try {
      message = (await res.json()).error || message;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(message);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${formType}-draft.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
