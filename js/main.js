var activated = ""

$(function() {
  $( 'ul.fromData li' ).on( 'click', function() {
        liActive = $( this ).parent().find( 'li.active' )
        liActive.removeClass( 'active' );
        $('div.'+liActive.get(0).id).hide();
        $( this ).addClass( 'active' );
        $('div.'+$( this ).get(0).id).show("slow");
        window.document.querySelector("textarea[decodeWallets]").value = ""
        if ($( this ).get(0).id != "fromText") $('div.info').hide()
        if ($( this ).get(0).id == "fromFile") activated = "file"
  });
});

const getMimetype = (signature) => {
    switch (signature) {
        case '89504E47':
            return 'image/png'
        case '47494638':
            return 'image/gif'
        case '25504446':
            return 'application/pdf'
        case 'FFD8FFDB':
        case 'FFD8FFE0':
        case 'FFD8FFE1':
            return 'image/jpeg'
        case '00000020': //temporary
            return 'video/mp4'
        case '504B0304':
            return 'application/zip'
        default:
            return 'Unknown filetype'
    }
}

function encodeFile (file) {
  var reader = new FileReader();
   reader.onload = async function() {
    var arrayBuffer = this.result,
    arrayBufferView = new Uint8Array(arrayBuffer)

    const uint = arrayBufferView.slice(0,4)
    let bytes = []
    uint.forEach((byte) => {
      bytes.push(byte.toString(16))
    })
    const hex = bytes.join('').toUpperCase()

    if (isImage(file.name) || getMimetype(hex).startsWith("image")) { //thumbnail
      document.getElementById('list').innerHTML = '<span><img class="thumb" src="img/load.gif" width="170px" title="decoded_image"/></span>';
      await sleep(100)
      var blob = new Blob( [ arrayBufferView ], { type: "image/jpeg" } );
      var urlCreator = window.URL || window.webkitURL;
      var imageUrl = urlCreator.createObjectURL( blob );
      var img = document.querySelector( ".thumb" );
      img.src = imageUrl;
      document.getElementById('list').innerHTML += "<div class=\"download\"><a href=\"#\">Download File</a></div>"
    }

    var saveData = (function () {
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        return function (data, fileName) {
            //var json = JSON.stringify(data),
                blob = new Blob([data], {type: "octet/stream"}),
                url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = fileName;
            a.click();
            window.URL.revokeObjectURL(url);
        };
    }());

    toWallet(arrayBufferView)

    $( '.download a' ).on( 'click', function() {
      saveData(arrayBufferView, "download.png")
    })

  }
  reader.readAsArrayBuffer(file);
}

function concatTypedArrays(a, b) {
    var c = new (a.constructor)(a.length + b.length);
    c.set(a, 0);
    c.set(b, a.length);
    return c;
}

function removeAllElements(arrayBuffer, elem) {
    var typedArray = arrayBuffer, i;
    var index = typedArray.indexOf(elem)
    while (index > -1) {
      for ( i = index+1; i < typedArray.length; i+=1 ) {
          typedArray[i-1] = typedArray[i]
      }
      typedArray = new Uint8Array (typedArray.buffer.slice(0, typedArray.length-1))
      index = typedArray.indexOf(elem)
    }
    return typedArray
}

var newline = 0
var prefix = "nano"
var myChunkUint8array = new ArrayBuffer(32)


function toWallet (arrayBuffer) {
    var uint8array = arrayBuffer
    var outputText = ""
    encodeText.output.value = ""
    for (bytecount=0; bytecount<uint8array.length; bytecount += 32){
      myChunkUint8array = uint8array.slice(bytecount, bytecount + 32)
      var address = utf8nano.fConvertFinalV2(myChunkUint8array, prefix);
      if (address) {
        outputText += address + "\n"
        //encodeText.output.value += address + "\n"
      } else {
        //encodeText.output.value += "\nError\n";
        outputText += "\nError\n"
      }
    }
    encodeText.output.value = outputText
    document.querySelector(".right .infoInput span#wallets").innerText = encodeText.output.value.split('\n').length - 1
}

  var checkboxNewline1 = document.querySelector("input[name=newlineYes]");
  var checkboxNewline2 = document.querySelector("input[name=newlineNo]");
  var checkboxPrefix1 = document.querySelector("input[name=nano]");
  var checkboxPrefix2 = document.querySelector("input[name=xrb]");

$(document).ready( function() {

  encodeText = {"textarea": window.document.querySelector("textarea[encodeText]"), "output": window.document.querySelector("textarea[decodeWallets]")}
  decodeWallets = {"textarea": window.document.querySelector("textarea[decodeWallets]"), "output": window.document.querySelector("textarea[encodeText]")}
  encodeInputFile = {"input": window.document.querySelector("#inputFile"), "output": window.document.querySelector("textarea[encodeText]")}

  encodeText.textarea.addEventListener("keyup", function(e){
      var input = e.target.value
      document.querySelector(".left .infoInput span#chars").innerText = input.length
      document.querySelector(".left .infoInput span#bytes").innerText = new Blob([input]).size
      var uint8array = new TextEncoder("utf-8").encode(input);
      encodeText.output.value = ""
      for (bytecount=0; bytecount<uint8array.length; bytecount += 32){
        myChunkUint8array = uint8array.slice(bytecount, bytecount + 32)
        var address = utf8nano.fConvertFinalV2(myChunkUint8array, prefix);
        if (address) {
          encodeText.output.value += address + "\n"
        } else {
          encodeText.output.value += "\nError\n";
        }
      }
      document.querySelector(".right .infoInput span#wallets").innerText = encodeText.output.value.split('\n').length - 1
  })

  decodeWallets.textarea.addEventListener("keyup", function(e){

      //show loading gif
      if (activated == "file") {
        if (window.document.querySelector('#list img.thumb') === null) {
          var span = document.createElement('span');
          span.innerHTML = ['<img class="thumb" src="img/load.gif" width="170px" title="decoded_image"/>'].join('');
          document.getElementById('list').insertBefore(span, null);
        }
      }

      //decode textarea
      var lines = e.target.value.split('\n');
      var output = new Uint8Array()
      decodeWallets.output.value = ""
      for(var i=0; i<lines.length; i++){
        var myText=lines[i]
        if (myText.length > 0) {
          var res = nanotoutf8(myText)
          if (res) {
            var output = concatTypedArrays(output, res)
            if (newline) output = concatTypedArrays(output, new TextEncoder("utf-8").encodeText('\n'))
            document.querySelector(".right .infoInput span#wallets").innerText = i + 1
          } else {
            decodeWallets.output.value += "\nError\n"
          }
        }
      }

      if (activated == "file") {
        //detect magic number
        const uint = output.slice(0,4)
        let bytes = []
        uint.forEach((byte) => {
          bytes.push(byte.toString(16))
        })
        const hex = bytes.join('').toUpperCase()
        const mime = getMimetype()

        //if mimetype is image, show thumbnail
        if (mime.startsWith("image")) {
          var blob = new Blob( [ output ], { type: mime } );
          var urlCreator = window.URL || window.webkitURL;
          var imageUrl = urlCreator.createObjectURL( blob );
          var img = document.querySelector( ".thumb" );
          img.src = imageUrl;
        }

        if (mime.startsWith("video")) {
          var blob = new Blob( [ output ], { type: mime } );
          var urlCreator = window.URL || window.webkitURL;
          var videoUrl = urlCreator.createObjectURL( blob );
          document.querySelector("#list").innerHTML = "<video src=\"" + videoUrl + "\"></video>"
        }

        if (window.document.querySelector('#list .download') === null) {
            document.getElementById('list').innerHTML += "<div class=\"download\"><a href=\"" + imageUrl + "\">Download File</a></div>"
        }
      }

      output = removeAllElements(output, 0)
      decodeWallets.output.value += new TextDecoder("utf-8").decode(output);

      document.querySelector(".left .infoInput span#chars").innerText = decodeWallets.output.value.length
      document.querySelector(".left .infoInput span#bytes").innerText = new Blob([decodeWallets.output.value]).size
  })

  function handleFileEncode(evt) {
      file = evt.target.files[0]; // File from FileList object
      encodeFile(file)
  }


  //Check Box Events
  checkboxNewline1.addEventListener('change', function() {
    if(this.checked) {
      newline = 1
      checkboxNewline2.checked = false;
    } else {
      newline = 0
      checkboxNewline2.checked = true;
    }
  });
  checkboxNewline2.addEventListener('change', function() {
    if(this.checked) {
      newline = 0
      checkboxNewline1.checked = false;
    } else {
      newline = 1
      checkboxNewline1.checked = true;
    }
  });

  checkboxPrefix1.addEventListener('change', function() {
    if(this.checked) {
      prefix = "nano"
      checkboxPrefix2.checked = false;
    } else {
      prefix = "xrb"
      checkboxPrefix2.checked = true;
    }
  });
  checkboxPrefix2.addEventListener('change', function() {
    if(this.checked) {
      prefix = "xrb"
      checkboxPrefix1.checked = false;
    } else {
      prefix = "nano"
      checkboxPrefix1.checked = true;
    }
  });

  //TextArea Event
  encodeText.textarea.dispatchEvent(new KeyboardEvent('keyup'));
  decodeWallets.textarea.dispatchEvent(new KeyboardEvent('keyup'));
  encodeInputFile.input.addEventListener('change', handleFileEncode, false);


})

function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

function isImage(filename) {
  var formats = ["jpg", "jpeg", "png", "bmp", "gif"]
  for (format in formats) {
    if(filename.endsWith("."+formats[format])){
      return true
    }
  }
  return false
}
