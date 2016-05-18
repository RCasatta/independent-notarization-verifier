console.log("Hello");

var hash;

(function() {
   // your page initialization code here
   // the DOM will be available here
  var holder = document.getElementById('holder'),
       state = document.getElementById('status');

  if (typeof window.FileReader === 'undefined') {
    state.className = 'fail';
  } else {
    state.className = 'success';
  }

  document.getElementById('myInput').addEventListener('change', function(evt) {
      var f = evt.target.files[0];
      handleFileSelect(f);
    }, false);

})();


holder.ondragover = function () { this.className = 'hover'; return false; };
holder.ondragend = function () { this.className = ''; return false; };
holder.ondrop = function (e) {
  this.className = '';
  alert('warning','Document received, starting to hash...');
  e.preventDefault();
  var file = e.dataTransfer.files[0];
  handleFileSelect(file);

  return false;
};

function alert(color, text) {
    document.getElementById('status').innerText = text ;
}

function crypto_callback(p) {
    alert('warning','Hashing ' + (p*100).toFixed(0) + '% completed');
}

holder.onclick = function () {
    console.log("holder.onclick");

    document.getElementById('myInput').click(
    );
};

function humanFileSize(bytes, si) {
    var thresh = si ? 1000 : 1024;
    if(Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }
    var units = si
        ? ['kB','MB','GB','TB','PB','EB','ZB','YB']
        : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
    var u = -1;
    do {
        bytes /= thresh;
        ++u;
    } while(Math.abs(bytes) >= thresh && u < units.length - 1);
    return bytes.toFixed(1)+' '+units[u];
}


function handleFileSelect(file) {
   document.getElementById('filename').innerText = file.name;
   document.getElementById('filesize').innerText = humanFileSize(file.size,true);

   reader = new FileReader();
   reader.onload = function (event) {

   var data = event.target.result;
   setTimeout(function() {
        CryptoJS.SHA256(data, crypto_callback, crypto_finish);
      }, 200);
   };
   console.log(file);
   reader.readAsBinaryString(file);
}


function verify() {
  //https://insight.bitpay.com/api/tx/58d560400c7eb74ac2a3800951ae31713c3d190140216a2f2b6bcde8093f936a

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        console.log( xhr.responseText );
      }
    };
    xhr.open('GET', 'sidebar.html');
    xhr.send();
}


function crypto_finish(val) {
    hash=val;
    console.log("crypto_finish " + hash);
    alert('warning',"Document hash is " + hash );

    /*document.getElementById('hashinput').value=hash ;*/

}
