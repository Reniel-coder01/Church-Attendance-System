const SHEET_MEMBERS = 'Members';
const SHEET_ATTENDANCE = 'Attendance';
const ADMIN_TOKEN = 'JILChurchMan';
// Optional: set a Spreadsheet ID if this is a standalone Apps Script project.
// If empty or left as 'CHANGE_ME_SPREADSHEET_ID', the code will use getActive()
const SPREADSHEET_ID = 'CHANGE_ME_SPREADSHEET_ID';

function getSpreadsheet(){
  if(typeof SPREADSHEET_ID !== 'undefined' && SPREADSHEET_ID && SPREADSHEET_ID !== 'CHANGE_ME_SPREADSHEET_ID'){
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActive();
}

function doPost(e){
  var data = {};
  try{ data = JSON.parse(e.postData.contents); } catch(err){ return jsonResponse({error:'invalid json'},400); }
  var action = data.action;
  if(action=='check') return jsonResponse(handleCheck(data.qrId));
  if(action=='register') return jsonResponse(handleRegister(data.profile));
  if(action=='log') return jsonResponse(handleLog(data.qrId, data.event, data.scanner));
  return jsonResponse({error:'unknown action'},400);
}

function handleCheck(qrId){
  var ss = getSpreadsheet();
  var members = ss.getSheetByName(SHEET_MEMBERS);
  var rows = members.getDataRange().getValues();
  var header = rows[0];
  for(var r=1;r<rows.length;r++){
    if(rows[r][header.indexOf('QR_ID')]==qrId){
      var memberNo = rows[r][header.indexOf('Member No')];
      var name = rows[r][header.indexOf('Name')];
      // find attendance for today
      return {found:true, memberNo:memberNo, name:name};
    }
  }
  return {notFound:true};
}

function handleRegister(profile){
  var ss = getSpreadsheet();
  var members = ss.getSheetByName(SHEET_MEMBERS);
  // generate member no if empty
  var newMemberNo = generateMemberNo(members);
  var row = [newMemberNo, profile.name||'', profile.birthday||'', profile.gender||'', profile.address||'', profile.contact||'', profile.worker? 'Yes':'No', profile.ministry||'', profile.qrId];
  members.appendRow(row);
  // record Time In
  handleLog(profile.qrId, profile.event||'General', profile.scanner||'');
  return {success:true, memberNo:newMemberNo, name:profile.name};
}

function handleLog(qrId, eventName, scanner){
  var ss = getSpreadsheet();
  var members = ss.getSheetByName(SHEET_MEMBERS);
  var att = ss.getSheetByName(SHEET_ATTENDANCE);
  var now = new Date();
  var dateStr = Utilities.formatDate(now, ss.getSpreadsheetTimeZone(), 'yyyy-MM-dd');
  var rows = members.getDataRange().getValues();
  var header = rows[0];
  var memberRow = null;
  for(var r=1;r<rows.length;r++) if(rows[r][header.indexOf('QR_ID')]==qrId){ memberRow = rows[r]; break; }
  if(!memberRow) return {error:'member not found'};
  var memberNo = memberRow[header.indexOf('Member No')];
  var name = memberRow[header.indexOf('Name')];
  var ministry = memberRow[header.indexOf('Ministry')]||'';

  // search attendance for today
  var aRows = att.getDataRange().getValues();
  var aHeader = aRows[0];
  var foundIndex = -1;
  for(var a=1;a<aRows.length;a++){
    if(aRows[a][aHeader.indexOf('Date')]==dateStr && aRows[a][aHeader.indexOf('Member No')]==memberNo){ foundIndex=a; break; }
  }
  var timeStr = Utilities.formatDate(now, ss.getSpreadsheetTimeZone(), 'HH:mm:ss');
  if(foundIndex==-1){
    // create Time In
    var newRow = [dateStr, memberNo, name, ministry, timeStr, '', eventName||'', scanner||''];
    att.appendRow(newRow);
    return {status:'timein', name:name};
  } else {
    var timeIn = aRows[foundIndex][aHeader.indexOf('Time In')];
    var timeOut = aRows[foundIndex][aHeader.indexOf('Time Out')];
    if(timeIn && !timeOut){
      // set Time Out
      var col = aHeader.indexOf('Time Out') + 1; // 1-based
      att.getRange(foundIndex+1, col).setValue(timeStr);
      return {status:'timeout', name:name};
    } else {
      return {status:'completed', name:name};
    }
  }
}

function generateMemberNo(sheet){
  var lastRow = sheet.getLastRow();
  if(lastRow<2) return 'MIS-000001';
  var rows = sheet.getRange(2,1,lastRow-1,1).getValues();
  var max = 0;
  for(var i=0;i<rows.length;i++){
    var v = rows[i][0];
    if(typeof v==='string' && v.indexOf('MIS-')==0){
      var n = parseInt(v.split('-')[1]); if(!isNaN(n) && n>max) max=n;
    }
  }
  var next = (max+1).toString().padStart(6,'0');
  return 'MIS-'+next;
}

function jsonResponse(obj, code){
  var payload = JSON.stringify(obj);
  var output = ContentService.createTextOutput(payload).setMimeType(ContentService.MimeType.JSON);
  output.setHeader('Access-Control-Allow-Origin','*');
  if(code) output.setStatusCode(code);
  return output;
}