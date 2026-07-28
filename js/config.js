// Google Apps Script Web App endpoint that appends mailing-list signups to a
// Google Sheet — see the footer form (main.js) and popup modal (modal.js).
const MAILING_LIST_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbyQMZHtP5bKH8RQ1FE_AElW_VMMb7f15zf2b0gOxd7RSlkRiZJfaNWiy_AmqQSmcho/exec';

// Apps Script Web Apps don't reliably send CORS headers back to a browser
// fetch, so mode:'no-cors' is required — that also means the response body
// is opaque (can't be read to confirm success). The request still reaches
// the script and appends the row; callers show a success state optimistically.
export function submitToMailingList(email, source) {
  return fetch(MAILING_LIST_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain' }, // avoids a CORS preflight
    body: JSON.stringify({ email, source }),
  });
}
