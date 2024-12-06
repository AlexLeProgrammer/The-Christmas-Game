/**
 * Manage all ui elements
 * @author AlexEtienne
 * @since 2024-12-05
 */

let openedPage = "home";

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

/**
 * Start the game.
 */
function startGame() {
  startTime = Date.now();
  openPage("game");
}

function endGame() {
  if (phase === PHASES_DURATION.length) {
    document.querySelector("#end-title").innerHTML = "Vous avez gagné !";
    document.querySelector("#end-text").innerHTML = "Vous avez survécu à toutes les vagues";
  } else {
    phase--;
    document.querySelector("#end-text").innerHTML = `Vous avez terminé : ${phase} ${phase === 1 ? "vague" : "vagues"}`;
  }

  openPage("end");
}

startGame();
