// bytes:  is an array of any numbers of members
//         wich are integer numbers from 0 to 255 (00-ff) 
// offset: is a decimal number of the starting offset address
//         of the code (eg. 0x1000 if hex)

function hexview(bytes, offset = 0x0, format = "txt") {
  return;
  maxAddressDigits = (offset + (bytes.length)).toString(16);
  shift = Number("0x" + offset.toString(16).charAt(offset.toString(16).length - 1));
  maxAddressDigits = maxAddressDigits.length;
  let hexChain = ['0 ', '1 ', '2 ', '3 ', '4 ', '5 ', '6 ', '7 ', '8 ', '9 ', 'a ', 'b ', 'c ', 'd ', 'e ', 'f '];
  hexChain = hexChain.slice(shift, 16).concat(hexChain.slice(0, shift));
  hexChain = hexChain[0] + hexChain[1] + hexChain[2] + hexChain[3] + " " + hexChain[4] + hexChain[5] + hexChain[6] + hexChain[7] + " " + hexChain[8] + hexChain[9] + hexChain[10] + hexChain[11] + " " + hexChain[12] + hexChain[13] + hexChain[14] + hexChain[15];


  // Create the hex dump

  let hexDump = " ".repeat(maxAddressDigits + 1);
  hexDump += hexChain + " ".repeat(19) + "\n";
  hexDump += " ".repeat(maxAddressDigits + 1) + "-------- -------- -------- --------   " + hexChain.replace(/\s/g, '') + "\n";

  let hexLine = "";
  let asciiLine = "";
  for (let i = 0, bytesLength = bytes.length; i < bytesLength; i++) {
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
        offset.toString(16).padStart(maxAddressDigits, "0") + " " + hexLine.padEnd(36, " ") + "| " + asciiLine.padEnd(16, " ") + "\n";
      offset += 16;
      asciiLine = "";
      hexLine = "";
    }
  }

  if (format.toLowerCase() == "html") {
    console.log("es HTML");
    hexDump = hexDump.replace(/[\u00A0-\u9999<>\&]/g, ((i) => `&#${i.charCodeAt(0)};`));
    hexDump = hexDump.replaceAll(" ", '&nbsp;');
    hexDump = hexDump.replaceAll("\n", '<br>');
  }
  return hexDump;
}

//let bytes = [65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 20, 28, 32, 40, 41, 42, 43, 50, 51];
//console.log(hexview(bytes, 0xf1));
