QR Attendance System for Church MIS

Prototype files included:
- frontend/index.html — web scanner + registration UI
- frontend/app.js — frontend logic (scan, check, register, log)
- apps-script/code.gs — Google Apps Script backend (check/register/log)
- apps-script/appsscript.json — manifest for Apps Script

Quick start
1. Create a Google Sheet with sheets named `Members` and `Attendance` and add header rows as described below.
2. Create a new Google Apps Script project and paste `apps-script/code.gs` and set the manifest.

	You have two deployment options:

	- Bind the script to the target Google Sheet (open the sheet → Extensions → Apps Script) and deploy the web app. In this case `code.gs` uses `SpreadsheetApp.getActive()` and will access the bound sheet automatically.

	- Use a standalone Apps Script project: set `SPREADSHEET_ID` in `apps-script/code.gs` to your target sheet ID (replace `CHANGE_ME_SPREADSHEET_ID`) so the script uses `SpreadsheetApp.openById(SPREADSHEET_ID)` to access the sheet.

	Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone).
3. Copy the Web App URL and set it into `frontend/app.js` constant `WEB_APP_URL`.
4. Host `frontend/index.html` (GitHub Pages, simple static host, or open locally). Scanning will call the Apps Script web API.

Sheet headers (first row)
- Members: Member No, Name, Birthday, Gender, Address, Contact, Worker, Ministry, QR_ID
- Attendance: Date, Member No, Name, Ministry, Time In, Time Out, Event, Notes

Notes
- The Apps Script uses a simple token for admin endpoints. Change `ADMIN_TOKEN` in `apps-script/code.gs` before deploying.
- Replace the `WEB_APP_URL` in `frontend/app.js` with your deployed Apps Script URL.

If you want, I can deploy the Apps Script for you (you'll need to authorize the Google account). Would you like me to continue and deploy, or do you prefer step-by-step guidance to deploy yourself?