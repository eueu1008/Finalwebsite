class FancyNav {
  constructor ({ btns, nav, highlightColor, backgroundColor, strokeWidth }) {
    this.btns = btns
    this.nav = nav
    this.highlightColor = highlightColor
    this.strokeWidth = strokeWidth
    this.backgroundColor = backgroundColor
    this.transparent = this.alphaFromColor(highlightColor, 0)
  }

  render () {
    const svg = Snap(this.nav.clientWidth, this.nav.clientHeight)
    this.svgBtns = this.btns.map(btn => this.renderSVGBtns(btn, svg))

    const btnBBox = this.svgBtns[0].getBBox()
    this.offset = this.svgBtns[1].getBBox().cx - btnBBox.cx
    this.magicPath = this.renderMagicPath(svg, btnBBox)
    this.circumference = 2 * Math.PI * btnBBox.r1 // assume circle

    this.setCurrent()
    this.bindBtnEvents()
    this.nav.appendChild(svg.node)
  }

  renderSVGBtns (btn, svg) {
    // Hide html btns
    btn.style.opacity = 0
    const x = btn.offsetLeft + btn.offsetWidth / 2
    const y = btn.offsetTop + btn.offsetHeight / 2
    const r = btn.offsetHeight / 2 // assume circle

    const outerCircle = svg
      .circle(x, y, r)
      .attr({
        fill: this.transparent,
        stroke: this.highlightColor,
        strokeWidth: 2
      })
    const innerCircle = svg
      .circle(x, y, r / 4)
      .attr({
        fill: this.highlightColor,
        stroke: this.transparent,
        strokeWidth: 0,
        class: 'hoverIndicator',
        transform: 's0,0'
      })

    return svg.group(outerCircle, innerCircle)
  }

  renderMagicPath (svg, btnBBox) {
    const pathSegments = [
      `M${btnBBox.cx},${btnBBox.y2}`
    ].concat(
      this.svgBtns.reduce((acc, b, index, arr) => {
        const res = [
          `a${btnBBox.r1},${btnBBox.r1},0,0,0,0,-${btnBBox.height}`, // left circle
          `a${btnBBox.r1},${btnBBox.r1},0,0,0,0,${btnBBox.height}` // right circle
        ]
        if (index < arr.length - 1) {
          res.push(`l${this.offset},0`) // path to next circle, not on last one
        }
        return acc.concat(res)
      }, [])
    )

    return svg
      .path(pathSegments.join(' '))
      .attr({
        stroke: this.highlightColor,
        strokeWidth: this.strokeWidth,
        strokeLinecap: 'round',
        fill: this.transparent
      })
  }

  setCurrent () {
    const pathLength = Snap.path.getTotalLength(this.magicPath.attr('d')) // fixes length in Firefox
    // strokeDasharray: `${this.circumference - this.strokeWidth / 4}, ${pathLength}`,
    this.magicPath.attr({
      strokeDasharray: `${this.circumference - this.strokeWidth / 4}, ${pathLength}`,
      strokeDashoffset: 0
    })
  }

  goToIndex (index) {
    const dashOffset = -index * (this.circumference + this.offset)
    Snap.animate(this.removePx(this.magicPath.attr('strokeDashoffset')), dashOffset, v => {
      this.magicPath.attr({ strokeDashoffset: v })
    }, 600, mina.easeinout )
  }

  bindBtnEvents () {
    this.btns.forEach((btn, index) => {
      btn.addEventListener('click', () => this.handleClick(index), false)
      btn.addEventListener('mouseover', () => this.showFocus(index), false)
      btn.addEventListener('focus', () => this.showFocus(index), false)
      btn.addEventListener('mouseout', () => this.removeFocus(index), false)
      btn.addEventListener('blur', () => this.removeFocus(index), false)
    })
  }

  showFocus (index) {
    this.svgBtns[index]
      .select('.hoverIndicator')
      .stop()
      .animate({ transform: 's1,1' }, 225, mina.easein)
  }

  removeFocus (index) {
    this.svgBtns[index]
      .select('.hoverIndicator')
      .stop()
      .animate({ transform: 's0,0' }, 175, mina.easeout)
  }

  handleClick (index) {
    this.goToIndex(index)
  }

  removePx (str) {
    return parseInt(str.replace('px', ''), 10)
  }

  alphaFromColor (c, alpha) {
    const {r, g, b} = Snap.color(c)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
}

class Gallery {
  constructor ({ container, items, btns, nav }) {
    this.container = container
    this.items = items
    this.btns = btns
    this.nav = nav
    this.itemWidth = this.items[0].clientWidth
  }

  render () {
    this.btns.forEach((btn, index) => {
      btn.addEventListener('click', () => this.goToIndex(index), false)
    })

    const fancyNav = new FancyNav({
      btns: this.btns,
      nav: this.nav,
      highlightColor: '#00e',
      backgroundColor: '#FFFFFF',
      strokeWidth: 10
    }).render()
  }

  goToIndex (index) {
    this.container.style.transform = `translateX(${-index * this.itemWidth}px)`
  }
}

const gallery = new Gallery({
  container: document.querySelector('.js-container'),
  nav: document.querySelector('.js-nav'),
  items: Array.from(document.querySelectorAll('.js-item')),
  btns: Array.from(document.querySelectorAll('.js-button'))
}).render()

