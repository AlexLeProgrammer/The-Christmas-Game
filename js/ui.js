/**
 * Manage all ui elements
 * @author AlexEtienne
 * @since 2024-12-05
 */

let openedPage = "home";
let pseudo = "";

/**
 * Open a page by its id and closes all others
 * @param id the page to open
 */
function openPage(id) {
  for (let page of document.querySelectorAll(".page")) {
    page.style.display = "none";
  }

  document.getElementById(id).style.display = "flex";
  openedPage = id;
}

function startGame() {
  pseudo = document.querySelector("#home-pseudo").innerHTML;
  console.log(pseudo + " started to play");
  openPage("game");
}

startGame();
