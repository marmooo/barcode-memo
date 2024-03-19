function loadConfig() {
  if (localStorage.getItem("darkMode") == 1) {
    document.documentElement.setAttribute("data-bs-theme", "dark");
  }
}

function toggleDarkMode() {
  if (localStorage.getItem("darkMode") == 1) {
    localStorage.setItem("darkMode", 0);
    document.documentElement.setAttribute("data-bs-theme", "light");
  } else {
    localStorage.setItem("darkMode", 1);
    document.documentElement.setAttribute("data-bs-theme", "dark");
  }
}

// // https://webbibouroku.com/Blog/Article/isbn-10-js
// function toISBN10(isbn13) {
//   const sum = isbn13.split("").slice(3, 12).reduce((acc, c, i) => {
//     return acc + (c[0] - "0") * (10 - i);
//   }, 0);
//   const checkDigit = 11 - sum % 11;
//   const isbn10 = isbn13.substring(3, 12) + checkDigit.toString();
//   return isbn10;
// }

// https://fight-tsk.blogspot.com/2014/09/isbnjavascript.html
function toISBN13(prefix, isbn10) {
  const modulas = 10;
  const weight = 3;
  let targetCode = isbn10.trim().toUpperCase().replace(/[^\dX]/gi, "");
  targetCode = prefix + targetCode;
  let checkSum = 0;
  const chars = targetCode.split("");
  for (let i = 0; i < chars.length - 1; i++) {
    if (i % 2 == 0) {
      checkSum += parseInt(chars[i]);
    } else {
      checkSum += weight * parseInt(chars[i]);
    }
  }
  checkSum = modulas - (checkSum % modulas);
  let isbn13 = "";
  for (let i = 0; i < chars.length - 1; i++) {
    isbn13 = isbn13 + chars[i];
  }
  isbn13 = isbn13 + checkSum;
  return isbn13;
}

function isValidISBN13(isbn13) {
  const modulas = 10;
  const weight = 3;
  const targetCode = isbn13.trim().toUpperCase().replace(/[^\d]/gi, "");
  if (targetCode.length != 13) {
    return false;
  }
  let checkSum = 0;
  const chars = targetCode.split("");
  for (let i = 0; i < chars.length - 1; i++) {
    if (i % 2 == 0) {
      checkSum += parseInt(chars[i]);
    } else {
      checkSum += weight * parseInt(chars[i]);
    }
  }
  checkSum = modulas - (checkSum % modulas);
  return (checkSum == (parseInt(chars[chars.length - 1])));
}

function isValidISBN10(isbn10) {
  const modulas = 11;
  let weight = 10;
  const targetCode = isbn10.trim().toUpperCase().replace(/[^\dX]/gi, "");
  if (targetCode.length != 10) {
    return false;
  }
  let checkSum = 0;
  const chars = targetCode.split("");
  for (let i = 0; i < (chars.length - 1); i++) {
    checkSum += weight * parseInt(chars[i]);
    weight--;
  }
  checkSum = modulas - (checkSum % modulas);

  let actualCheckSum = 10;
  if (chars[chars.length - 1] != "X") {
    actualCheckSum = parseInt(chars[chars.length - 1]);
  }
  return (checkSum == actualCheckSum);
}

// function isISBN13(code) {
//   if (code.startsWith("978") || code.startsWith("979")) {
//     return true;
//   } else {
//     return false;
//   }
// }

// https://qiita.com/mm_sys/items/9e95c48d4684957a3940
function isValidEAN(barcodeStr) { // 引数は文字列
  // 短縮用処理
  barcodeStr = ("00000" + barcodeStr).slice(-13);
  let evenNum = 0, oddNum = 0;
  for (let i = 0; i < barcodeStr.length - 1; i++) {
    if (i % 2 == 0) { // 「奇数」かどうか（0から始まるため、iの偶数と奇数が逆）
      oddNum += parseInt(barcodeStr[i]);
    } else {
      evenNum += parseInt(barcodeStr[i]);
    }
  }
  // 結果
  return 10 - parseInt((evenNum * 3 + oddNum).toString().slice(-1)) ===
    parseInt(barcodeStr.slice(-1));
}

function getInfoFromISBN(isbn, callback) {
  fetch(
    "https://app.rakuten.co.jp/services/api/Product/Search/20170426?format=json&affiliateId=1fce7ad4.9ceb2f6a.1fce7ad5.f0e8d979&applicationId=1017197774015471253&keyword=" +
      isbn,
  )
    .then((response) => response.json())
    .then((data) => {
      if (data.hits > 0) {
        const product = data.Products[0].Product;
        const title = product.productName;
        const affiliateUrl = product.affiliateUrl;
        const info = document.createElement("a");
        info.href = affiliateUrl;
        info.textContent = title;
        if (callback) {
          callback(info);
        }
      }
    });
}

// function getInfoFromISBNByGoogle(isbn, callback) {
//   fetch("https://www.googleapis.com/books/v1/volumes?q=" + isbn)
//     .then((response) => response.json())
//     .then((data) => {
//       if (data.totalItems > 0) {
//         const title = data.items[0].volumeInfo.title;
//         const info = document.createTextNode(title);
//         if (callback) {
//           callback(info);
//         }
//       }
//     });
// }

function tick(time) {
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    loadingMessage.hidden = true;
    const width = video.videoWidth;
    const height = video.videoHeight;
    canvasElement.width = width;
    canvasElement.height = height;
    canvas.drawImage(video, 0, 0, width, height);
    if (time - prevTime > 500) {
      prevTime = time;
      const imageData = canvas.getImageData(0, 0, width, height);
      worker.postMessage({
        data: imageData.data,
        width: width,
        height: height,
      });
    }
  } else {
    loadingMessage.textContent = "⌛ Loading video...";
  }
  requestAnimationFrame(tick);
}

function initScan() {
  navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { facingMode: "environment" },
  }).then((stream) => {
    video.srcObject = stream;
    video.setAttribute("playsinline", "true");
    video.play();
    requestAnimationFrame(tick);
  }).catch((err) => {
    alert(err.message);
  });
}

function setProductInfo(code) {
  const scannedBox = document.createElement("scanned-box");
  const product = scannedBox.shadowRoot.querySelector(".product");
  scannedBox.shadowRoot.querySelector(".code").textContent = code;
  if (isValidISBN13(code)) {
    getInfoFromISBN(code, (productInfo) => {
      product.appendChild(productInfo);
    });
  } else if (isValidISBN10(code)) {
    ["978", "979"].some((prefix) => {
      const isbn13 = toISBN13(prefix, code);
      if (isValidISBN13(isbn13)) {
        getInfoFromISBN(code, (productInfo) => {
          product.appendChild(productInfo);
        });
        return true;
      }
    });
  } else if (isValidEAN(code)) {
    getInfoFromISBN(code, (productInfo) => {
      product.appendChild(productInfo);
    });
  }
  document.getElementById("memo").appendChild(scannedBox.shadowRoot);
}

function toCSV() {
  let csv = "";
  const trs = [...document.getElementById("memo").getElementsByTagName("tr")];
  trs.forEach((tr) => {
    const target = [...tr.children].slice(0, 2);
    const line = target.map((td) => td.textContent).join(", ");
    csv += line + "\n";
  });
  copyToClipboard(csv);
}

async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text);
  alert("クリップボードにコピーしました。");
}

function initWorker() {
  const worker = new Worker("/barcode-memo/koder.js");
  worker.onmessage = (ev) => {
    const code = ev.data.data;
    if (!code) return;
    if (prevCode != code) {
      prevCode = code;
      setProductInfo(code);
    }
  };
  return worker;
}

customElements.define(
  "scanned-box",
  class extends HTMLElement {
    constructor() {
      super();
      const template = document.getElementById("scanned-box")
        .content.cloneNode(true);
      template.querySelector("button").onclick = (event) => {
        event.target.parentNode.parentNode.remove();
      };
      this.attachShadow({ mode: "open" }).appendChild(template);
    }
  },
);

let prevTime = 0;
let prevCode;
loadConfig();
const video = document.createElement("video");
const canvasElement = document.getElementById("canvas");
const canvas = canvasElement.getContext("2d");
const loadingMessage = document.getElementById("loadingMessage");
const worker = initWorker();
initScan();

document.getElementById("toggleDarkMode").onclick = toggleDarkMode;
document.getElementById("toCSV").onclick = toCSV;
