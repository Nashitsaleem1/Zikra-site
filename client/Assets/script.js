let submitBtn = document.querySelector("#btn");
// let ayatNumber = document.querySelector('.ayat-number');
let suratName = document.querySelector(".surat-name");
let sabaqNumber = document.querySelector(".sabaq-number");
let crossBtn = document.querySelector(".cross-symbol");
let popUp = document.querySelector(".popup");
let overlay = document.querySelector(".overlay");
// let ayah = document.querySelector('.ayah');
// let paraNumber = document.querySelector('#para-number');
// let value = document.querySelector(`#value-1`);


function closePopandOverlay(params) {
  overlay.style.display = "none";
  popUp.style.display = "none";
}

crossBtn.addEventListener("click", () => {
  closePopandOverlay();
});

document.addEventListener("DOMContentLoaded", () => {
  overlay.style.display = "block";
  popUp.style.display = "flex";
});

overlay.addEventListener("click", () => {
  closePopandOverlay();
});

// function removeElementsByClass(className) {
//     const elements = document.getElementsByClassName(className);
//     while (elements.length > 0) {
//         elements[0].parentNode.removeChild(elements[0]);
//     }
// }

// var currentActive = 1;
// var chunks
// var inputs = []
// var count = 0
// var sabaqMax = 1;
// var newArray = []

function isElementInViewport(el) {
  var rect = el.getBoundingClientRect();

  return (
    rect.top > 0 &&
    rect.left >= 0 &&
    rect.bottom <
      (window.innerHeight || document.documentElement.clientHeight) -
        (window.innerHeight || document.documentElement.clientHeight) * 0.18 &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

function update(chunks, currentActive) {
  chunks.forEach((circle, idx) => {
    if (idx < currentActive) {
      circle.classList.add("active");
      if (!isElementInViewport(circle)) circle.scrollIntoView(true);
    } else {
      circle.classList.remove("active");
    }
  });
}

// function populate(array, sabaq) {
//     removeElementsByClass('content-div')
//     let contentDiv = document.createElement('div');
//     contentDiv.className = 'content-div';
//     ayah.append(contentDiv);

//     newArray = array.toString().replace(/[\[\]']|:|,,+/g, '').split(' ');

//     // ayatNumber.textContent = `( ${newArray.pop()} )`;

//     suratName.textContent = `سورة :
//     ${newArray[newArray.length - 2]}  (${newArray[newArray.length - 1]}) `;
//     newArray.pop();
//     newArray.pop();
//     let i = 0;
//     for (i = 0; i < newArray.length; i++) {
//         const element = newArray[i];
//         let newElem = document.createElement('span');
//         newElem.innerText = element;
//         newElem.className = 'chunk';
//         contentDiv.append(newElem);
//     }
//     chunks = document.querySelectorAll('.chunk');
//     currentActive = 1;
//     count++;
//     if (count == 1) {
//         document.body.addEventListener('keydown', (event) => {
//             if (event.keyCode === 37 || event.keyCode == 32) {
//                 currentActive++
//                 update()
//                 if (currentActive - 1 == newArray.length) {
//                     populate(inputs[count % inputs.length], (count % inputs.length) + 1)
//                 }
//             }
//             if (event.keyCode === 39 || event.keyCode == 80) {
//                 if (currentActive > 0) {
//                     currentActive--
//                 } else {
//                     currentActive = 0;
//                     populate(inputs[(count - 1) % inputs.length], ((count - 1) % inputs.length) + 1)
//                 }
//                 update()
//             }
//         })
//     }
// }

submitBtn.addEventListener("click", () => {
  closePopandOverlay();
  //     let i = 1
  //     while (document.querySelector(`#value-${i}`).value) {
  //         let ayats = document.querySelector(`#value-${i++}`).value.split("]")
  //         let j = 0;
  //         while (ayats[j]) {
  //             inputs.push([ayats[j++] + "]"])
  //         }
  //         if (i == 2)
  //             break;
  //     }
  //     populate(inputs[count], 1);
});

// window.addEventListener("keyup", function(event) {
//     // Number 13 is the "Enter" key on the keyboard
//     if (event.keyCode === 13) {
//       // Cancel the default action, if needed
//       event.preventDefault();
//       // Trigger the button element with a click
//       document.getElementById("btn").click();
//     }
//   });

function toArabicNumeral(num) {
  const arabicNums = {
    0: "٠",
    1: "١",
    2: "٢",
    3: "٣",
    4: "٤",
    5: "٥",
    6: "٦",
    7: "٧",
    8: "٨",
    9: "٩",
  };

  return String(num).replace(/[0-9]/g, function (w) {
    return arabicNums[w];
  });
}

function toRegularNumeral(num) {
  const regularNums = {
    "٠": "0",
    "١": "1",
    "٢": "2",
    "٣": "3",
    "٤": "4",
    "٥": "5",
    "٦": "6",
    "٧": "7",
    "٨": "8",
    "٩": "9",
  };

  return num
    .split("")
    .map((digit) => regularNums[digit])
    .join("");
}

const form = document.querySelector("#filter-form");
const filteredDataDiv = document.querySelector(".content-div");
let activeIndex = 0;
let arr = [];
let index = 0;

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const juzNo = document.querySelector("#juz-no").value;
  sabaqNumber.textContent = `جزء : ${juzNo}`;

  fetch(`http://localhost:3000/filter?juzNo=${juzNo}`)
    .then((response) => response.json())
    .then((data) => {
      const filteredData = data.map((item) => {
        const ayahNo = item[10];
        const ayahText = item[12];
        const surahName = item[5];
        arr.push(surahName);
        const words = ayahText.split(/\s(?![ًٌٍَُِّْٰۖۗۘۙۚۛۜ۩])/);
        const wordSpans = words.map(
          (word) => `<span class = chunk>${word}</span>`
        );
        const ayahHtml =
          wordSpans.join(" ") +
          ` <span class = "chunk ayahStop" >${toArabicNumeral(ayahNo)}</span>`;
        return ayahHtml;
      });
      const filteredDataHtml = filteredData.join("");
      filteredDataDiv.innerHTML = filteredDataHtml;
      suratName.textContent = `سورة : ${arr[0]} `;

      const allSpanTags = document.querySelectorAll(".chunk");
      allSpanTags[activeIndex].classList.add("active");
      activeIndex++;
      document.addEventListener("keydown", (e) => {
        if (e.keyCode == 37) {
          if (activeIndex <= allSpanTags.length - 1)
            allSpanTags[activeIndex].classList.add("active");
          activeIndex++;
          update(allSpanTags, activeIndex);
          const activeAyahStops = document.querySelectorAll(".ayahStop.active");
          const numActiveAyahStops = activeAyahStops.length;

          suratName.textContent = `سورة : ${arr[numActiveAyahStops]} `;
        }
        if (e.keyCode == 39) {
          if (activeIndex > 0) {
            allSpanTags[activeIndex].classList.remove("active");

            activeIndex--;
            update(allSpanTags, activeIndex);
          }
        }
      });
    })
    .catch((error) => console.error(error));
});

document.addEventListener("keydown", (event) => {
  if (event.keyCode == 187) {
    var el = document.querySelectorAll(".chunk");
    el.forEach((el) => {
      var style = window
        .getComputedStyle(el, null)
        .getPropertyValue("font-size");
      var fontSize = parseFloat(style);
      el.style.fontSize = fontSize + 5 + "px";
    });
  }
  // now you have a proper float for the font size (yes, it can be a float, not just an integer)
});

document.addEventListener("keydown", (event) => {
  if (event.keyCode == 189) {
    var el = document.querySelectorAll(".chunk");
    el.forEach((el) => {
      var style = window
        .getComputedStyle(el, null)
        .getPropertyValue("font-size");
      var fontSize = parseFloat(style);
      el.style.fontSize = fontSize - 5 + "px";
    });
  }
});
