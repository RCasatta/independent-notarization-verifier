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

  document.getElementById('verifyButton').onclick = function() {
    if(!hash) {
      alert("Select a document first");
      return;
    }
    var stamp;
    try {
      var stampString = document.getElementById('jsonstamp').value;
      console.log("verifyButton clicked");
      var stamp = JSON.parse(stampString);
    } catch(e) {}

    if(!stamp) {
      alert("Stamp data is not a valid");
      return;
    }
    verify(hash,stamp);
  }

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

function status(text) {
    document.getElementById('status').innerText = text ;
}

function crypto_callback(p) {
    status('Hashing ' + (p*100).toFixed(0) + '% completed');
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
        CryptoJS_.SHA256(data, crypto_callback, crypto_finish);
      }, 200);
   };
   console.log(file);
   reader.readAsBinaryString(file);
}


function verify(hash, stamp) {
  //https://insight.bitpay.com/api/tx/58d560400c7eb74ac2a3800951ae31713c3d190140216a2f2b6bcde8093f936a
  var stampAndDocumentMatchCheck;
  var stampAndDocumentMatch = document.getElementById('stampAndDocumentMatch');
  if( stamp.merkle.hash == hash ) {
    stampAndDocumentMatch.innerText = "Document hash matches the one in the stamp";
    stampAndDocumentMatchCheck=true;
  } else {
    stampAndDocumentMatch.innerText = "Document DOES NOT MATCH the one which the stamp refer to";
    stampAndDocumentMatchCheck=false;
    return;
  }

  var siblingsMatchCheck;
  var siblingsMatch = document.getElementById('siblingsMatch');
  var merkle=stamp.merkle;
  var index=merkle.index;
  var siblings=merkle.siblings;
    var current=merkle.hash;
  console.log(siblings);

  for(var i=0;i<siblings.length;i++) {
    var s=siblings[i];
    var toHash;
    if(index%2==0) {
      toHash=current+s;
    } else {
      toHash=s+current;
    }
    var toHashBin = CryptoJS.enc.Hex.parse(toHash);
    current = CryptoJS.SHA256( CryptoJS.SHA256(toHashBin) ).toString(CryptoJS.enc.Hex);
    index=index>>1;
  }
  var root= current.match(/.{1,2}/g).reverse().join("");
  console.log("root=" + root);

  if(root==merkle.root) {
    siblingsMatch.innerText = "Merkle root derived from hash and siblings matches the one in the stamp";
    siblingsMatchCheck=true;
  } else {
    siblingsMatch.innerText = "Merkle root derived from hash and siblings DOES NOT MATCH the one in the stamp";
    siblingsMatchCheck=false;
  }
  
  //CryptoJS.SHA256();

  
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        console.log( xhr.responseText );
        var data = JSON.parse(xhr.responseText);

        var timeMatchCheck=false;
        var timeMatch = document.getElementById('timeMatch');
        if(data.blocktime == stamp.timestamp){
          timeMatch.innerText = "Timestamp from the block matches the one in the stamp " + new Date(stamp.timestamp*1000);
          timeMatchCheck=true;
        } else {
          timeMatch.innerText = "Timestamp from the block " + new Date(data.blocktime*1000) + " DOES NOT MATCH the one in the stamp " + new Date(stamp.timestamp*1000);
          timeMatchCheck=false;
        }
        
        var rootMatchCheck=false;
        var rootMatch=document.getElementById('rootMatch');
        
        for(var i=0;i<data.vout.length;i++) {
          var current = data.vout[i];
          var hex = current.scriptPubKey.hex ;
          if(hex.startsWith("6a")) { //is op_return
            if(hex.substring(4).startsWith("455743")  || hex.substring(4).startsWith("584557") ) {  //is EWC || XEW
              if(hex.substring(10) == stamp.merkle.root ) {
                rootMatch.innerText= "Merkle root " + stamp.merkle.root + " matches what found in the bitcoin transaction " + stamp.txHash;
                rootMatchCheck=true;
                break;
              }
            }
          }
        }
        if(!rootMatchCheck) {
          rootMatch.innerText= "Merkle root " + stamp.merkle.root + " DOES NOT MATCH what found in the bitcoin transaction";
        }

        var finalCheck=document.getElementById('finalCheck');
        if( stampAndDocumentMatchCheck && siblingsMatchCheck && timeMatchCheck && rootMatchCheck) {
          finalCheck.innerText = "CONGRATULATIONS your documents and the stamp are valid";
        } else {
          finalCheck.innerText = "SORRY your documents and the stamp did not pass some checks";
        }
      }
    };
    xhr.open('GET', 'https://insight.bitpay.com/api/tx/' + stamp.txHash);
    xhr.send();
}


function crypto_finish(val) {
    hash=val;
    console.log("crypto_finish " + hash);
    status("Document hash is " + hash );

    /*document.getElementById('hashinput').value=hash ;*/

}
