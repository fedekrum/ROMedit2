var originalFileContent;
var newFileContent;
var originalFileName = " ";
//var fileLength = 0;
var md5Hash = "";
var md5NewHash = "";
var values = "";
var valuesStatus = "";
var changes;
var data;
var offset = Number("0x" + document.getElementById("offset").value); //decimal

document.getElementById("offsetDefault").innerHTML =
  document.getElementById("offset").value;
document.getElementById("offsetDEC").innerHTML = offset;

function handleDragOver(event) {
  event.stopPropagation();
  event.preventDefault();
  event.dataTransfer.dropEffect = "copy";
}

function handleFileSelect(event) {
  event.stopPropagation();
  event.preventDefault();

  let files =
    event.type === "drop" ? event.dataTransfer.files : event.target.files;
  let file = files[0];
  let reader = new FileReader();

  reader.onload = function (event) {
    let arrayBuffer = event.target.result;
    originalFileContent = new Uint8Array(arrayBuffer);
    newFileContent = originalFileContent.slice();

    console.log(originalFileContent);
    console.log(newFileContent);
    //hexview(newFileContent);
    // Update MD5
    md5Hash = md5(newFileContent.buffer);
    document.getElementById("md5").innerHTML = md5Hash;

    // Update filename and filesize
    document.getElementById("filename").innerHTML = file.name;
    document.getElementById("filelength").innerHTML = file.size;
    // Show hidden csv and offset-group
    document.getElementById("csv").removeAttribute("hidden");
    document.getElementById("offset-group").removeAttribute("hidden");
    generateNewFile();
  };
  reader.readAsArrayBuffer(file);
}

function hexview(bytes) {
  // Create the hex dump
  let hexDump = "00010203 04050607 08090a0b 0c0d0e0f\n";
  hexDump += "-------- -------- -------- --------\n";
  let hexLine = "";
  let asciiLine = "";
  for (let i = 0; i < bytes.length; i++) {
    // Convert byte to hex
    let byteHex = bytes[i].toString(16).padStart(2, "0");
    hexLine += byteHex;

    // Convert byte to ASCII
    let byteChar = bytes[i];
    let char =
      byteChar >= 0x20 && byteChar <= 0x7e
        ? String.fromCharCode(byteChar)
        : ".";
    asciiLine += char;

    // Add spaces after every 4 bytes
    if ((i + 1) % 4 == 0) {
      hexLine += " ";
    }

    // If last byte or if EOL
    if (i == bytes.length - 1 || (i + 1) % 16 == 0) {
      hexDump +=
        hexLine.padEnd(36, " ") + "| " + asciiLine.padEnd(16, " ") + "\n";
      asciiLine = "";
      hexLine = "";
    }
  }

  // Show the hex and ASCII dumps
  let pre = document.getElementById("file-content");
  pre.textContent = hexDump;
}

function setByteAt(indexStr, dataStr) {
  //indexStr = parseInt(indexStr.toString(), 16);
  //dataStr = parseInt(dataStr.toString(), 16);
  if (indexStr - offset > newFileContent.length - 1) return;
  if (indexStr - offset < 0) return;
  newFileContent[indexStr - offset] = dataStr;
}

// generate

// ---------------- VALUES INPUT EVENT
document.getElementById("values").oninput = () => {
  generateNewFile();
};

// ---------------- OFFSET INPUT EVENT
document.getElementById("offset").oninput = () => {
  offset = Number("0x" + document.getElementById("offset").value);
  if (isNaN(offset)) offset = 0;
  document.getElementById("offsetDEC").innerHTML = offset;
  generateNewFile();
  console.log(offset); // Do something
};

// ---------------- PARALLEL SCROLL
document.getElementById("values").addEventListener("scroll", function () {
  document.getElementById("valuesStatus").scrollTop = this.scrollTop;
});








function generateNewFile() {
  str = document.getElementById("values").value;
  console.log(str);

  // document
  //   .getElementById("download_link")
  //   .setAttribute("hidden", "hidden");

  var csvIndex;
  var csvData;
  // for (let loop = 0; loop < originalFileContent.length; loop++) {
  //   newFileContent[loop] = originalFileContent[loop];
  // }
  newFileContent = originalFileContent.slice();
  newFileContent[0] = 1;

  const lines = str.split(/\r?\n/); // Split string into array of lines
  const hexPairRegex = /^[0-9a-fA-F]*(?:[,:;-])[0-9a-fA-F]{1,2}$/; // Regex for hex pairs separated by comma
  console.log("---");
  changes = 0;
  valuesStatus = "";
  var msg;
  for (let i = 0; i < lines.length; i++) {
    msg = "✅";
    valuesStatus = valuesStatus + (i + 1) + " ";
    const line = lines[i].replace(/\s/g, ""); // Remove all whitespace from line

    if (hexPairRegex.test(line)) {
      csvIndex = Number("0x" + line.split(/[,:;-]/)[0]) - offset;
      csvData = Number("0x" + line.split(/[,:;-]/)[1]);
      console.log(newFileContent.length);
      if (csvIndex >= 0 && csvIndex < newFileContent.length) {
        changes++;
        setByteAt(csvIndex + offset, csvData);
        console.log(
          `Line ${i + 1
          } contains a valid hex pair: ${csvIndex}*${csvData}`
        );
      } else {
        msg = "🚫R";
      }
    } else {
      msg = "🚫S";
      if (line == "") {
        msg = "";
      }
    }
    valuesStatus = valuesStatus + msg + "\r";
  }

  document.getElementById("valuesStatus").innerHTML = valuesStatus;

  md5Hash = md5(newFileContent.buffer);

  document.getElementById("md5Hash").innerHTML = md5Hash;

  if (changes > 0) {
    document.getElementById("download_link").removeAttribute("hidden");
    document.getElementById("md5HashView").removeAttribute("hidden");
  } else {
    document
      .getElementById("download_link")
      .setAttribute("hidden", "hidden");
    document
      .getElementById("md5HashView")
      .setAttribute("hidden", "hidden");
  }

  document.getElementById("changes").innerHTML = changes;
  hexview(newFileContent);

  // ---------------- DOWNLOAD LINK GENERATOR (BLOB)
  //data = new Blob([newFileContent], { type: "application/octet-stream" });
  data = new Blob([newFileContent.buffer], {
    type: "application/octet-stream",
  });
  url = window.URL.createObjectURL(data);
  document
    .getElementById("download_link")
    .setAttribute("download", originalFileName);
  document.getElementById("download_link").href = url;

  console.log(`Changes: ${changes}`);
}