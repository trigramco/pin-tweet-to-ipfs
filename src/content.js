/* global chrome, MutationObserver, DOMParser */
import iconLogo from './logo.svg'

const observer = new MutationObserver(onMutation)
observer.observe(document, {
  childList: true,
  subtree: true
})

function onMutation (mutations) {
  const currentUrl = window.location.href
  const isTweetPage = currentUrl.includes('status')

  const getTweetUrl = (e) => {
    let tweetUrl

    if (isTweetPage) {
      tweetUrl = currentUrl
    } else {
      const selectedTweet = e.target.closest('article')
      tweetUrl = selectedTweet.querySelector(
        '[role="link"][href*="status"]'
      )?.href
    }

    chrome.runtime.sendMessage({ url: tweetUrl })
  }

  const createButton = (small = false) => {
    // Icon svg
    const parser = new DOMParser()
    const logo = parser.parseFromString(iconLogo, 'image/svg+xml')
    logo.documentElement.setAttribute('width', '18px')
    logo.documentElement.setAttribute('height', '18px')
    logo.documentElement.style.marginTop = '3px'

    // Button text label
    const label = document.createElement('span')
    label.innerHTML = 'Pin Tweet to IPFS'
    label.style.padding = '5px'

    const pinTweetButton = document.createElement('button')
    pinTweetButton.appendChild(pinTweetButton.ownerDocument.importNode(logo.documentElement, true))
    if (!small)
      pinTweetButton.appendChild(label)
    pinTweetButton.style.display = 'flex'
    pinTweetButton.style.backgroundColor = 'rgb(104 131 149)'
    pinTweetButton.style.color = '#fff'
    pinTweetButton.style.border = 'none'
    pinTweetButton.style.borderRadius = '4px'
    pinTweetButton.style.margin = '5px'
    pinTweetButton.style.letterSpacing = '0.5px'
    pinTweetButton.style.padding = '5px 10px'
    pinTweetButton.style.cursor = 'pointer'
    pinTweetButton.style.minWidth = small ? '' : '165px'
    pinTweetButton.addEventListener('click', (e) => getTweetUrl(e))
    pinTweetButton.id = `pin-tweet-${new Date().toISOString()}`
    pinTweetButton.title = 'Pin Tweet to IPFS'
    return pinTweetButton
  }

  const found = []
  for (const { addedNodes } of mutations) {
    for (const node of addedNodes) {
      if (!node.tagName) continue // not an element

      if (isTweetPage) {
        [].slice
          .apply(node.querySelectorAll("[role='group']"))
          .filter(
            (node) =>
              node.ariaLabel &&
              node.ariaLabel.includes('view') &&
              node.id &&
              !found.includes(node)
          )
          .forEach((node) => found.push(node))
      } else {
        [].slice
          .apply(node.querySelectorAll('[aria-label]'))
          .filter(
            (node) =>
              node.ariaLabel.includes('view') &&
              node.id &&
              !found.includes(node)
          )
          .forEach((node) => found.push(node))
      }
    }
  }

  found.forEach((n) => {
    if (n.querySelector("[id^='pin-tweet']")) return // return early if there is already a button appended
    n.appendChild(createButton(n.offsetWidth < 165 * 2))
  })
}
