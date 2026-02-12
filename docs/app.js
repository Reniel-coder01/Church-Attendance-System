// Replace this with your deployed Apps Script Web App URL
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzZIH1F44O15rUH_zERhohwLvxCY9nTey50ixkV6Oe5wjPrlHCaqyQi8QzR5W9PMdWYYA/exec';

const statusEl = document.getElementById('status');
const registerPanel = document.getElementById('registerPanel');
const regForm = document.getElementById('registerForm');

function setStatus(t){ statusEl.textContent = t }

function postJson(obj){
  return fetch(WEB_APP_URL, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(obj)
  }).then(r=>r.json());
}

function handleScan(qrId){
  setStatus('Scanned: ' + qrId + ' — checking...');
  postJson({action:'check', qrId}).then(res=>{
    if(res.notFound){
      // show register form
      document.getElementById('reg_qr').value = qrId;
      registerPanel.style.display = 'block';
      setStatus('ID not found. Please register.');
    } else {
      // existing member: log attendance
      postJson({action:'log', qrId, event:res.event||'General'}).then(r=>{
        if(r.status==='timein') setStatus('Time In recorded for ' + res.name);
        else if(r.status==='timeout') setStatus('Time Out recorded for ' + res.name);
        else if(r.status==='completed') setStatus('Attendance already completed for today');
        else setStatus('Logged: ' + JSON.stringify(r));
      }).catch(err=>setStatus('Log error: '+err));
    }
  }).catch(err=>setStatus('Check error: '+err));
}

// initialize scanner
const html5QrCode = new Html5Qrcode("reader");
Html5Qrcode.getCameras().then(cameras=>{
  if(cameras && cameras.length){
    const cameraId = cameras[0].id;
    html5QrCode.start(cameraId, {fps:10, qrbox:250}, qrCodeMessage=>{
      // stop for a moment to prevent double reads
      html5QrCode.pause(true);
      const id = qrCodeMessage.trim();
      handleScan(id);
      // dispatch a custom event so the UI can react (last-scanned, animations)
      try{window.dispatchEvent(new CustomEvent('qr-scanned',{detail:{id}}))}catch(e){}
      // flash reader briefly
      const readerEl = document.getElementById('reader');
      if(readerEl){readerEl.classList.add('scanned'); setTimeout(()=>readerEl.classList.remove('scanned'),700)}
      setTimeout(()=>html5QrCode.resume(), 1500);
    }, errorMessage=>{
      // ignore
    }).catch(err=>setStatus('Scanner start failed: '+err));
  } else setStatus('No camera found');
}).catch(err=>setStatus('Camera error: '+err));

regForm.addEventListener('submit', function(e){
  e.preventDefault();
  const profile = {
    qrId: document.getElementById('reg_qr').value,
    name: document.getElementById('name').value,
    birthday: document.getElementById('birthday').value,
    gender: document.getElementById('gender').value,
    address: document.getElementById('address').value,
    contact: document.getElementById('contact').value,
    worker: document.getElementById('worker').checked,
    ministry: document.getElementById('ministry').value
  };
  setStatus('Registering...');
  postJson({action:'register', profile}).then(res=>{
    if(res.success){
      setStatus('Registered and Time In recorded for ' + res.name);
      registerPanel.style.display = 'none';
    } else setStatus('Register error: '+(res.error||'unknown'));
  }).catch(err=>setStatus('Register error: '+err));
});