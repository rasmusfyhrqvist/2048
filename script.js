const ANIMATION = {
    PULSE: {
        class: 'pulse',
        dur: 500
    },
    FADEIN: {
        class: 'fade-in',
        dur: 700
    }
}

class Tile {
    constructor() {
        this.id = 'b' + Game.idCounter++

        let div = document.createElement('div')
        div.id = this.id
        div.classList.add('block')
        Game.el.appendChild(div)

        this.n = Math.random() > .3 ? 2 : 4

        let { x, y } = Game.getEmptyTile()
        this.place(x, y).animate(ANIMATION.FADEIN).n = this.n

        Game.board[y][x] = this

        return this
    }

    place(x, y) {
        this.x = x
        this.y = y

        this.el.style.setProperty('--x', x)
        this.el.style.setProperty('--y', y)

        return this
    }
    upgrade() {
        this.n = this.n * 2

        return this
    }
    animate(a) {
        this.el.classList.add(a.class)
        setTimeout((el) => { el.classList.remove(a.class) }, a.dur, this.el);

        return this
    }
    remove() {
        this.el.parentNode.removeChild(this.el)
        delete this
    }

    id
    x
    y
    #n

    set n(n) {
        this.#n = n
        n = Math.log2(n)

        this.el.style.setProperty('--b', `hsl(${n < 7 ? -10 * n + 60 : 45},${n < 7 ? -3 * n * (n - 15) : n < 12 ? 8 * n + 12 : 20}%,${n < 12 ? 93 - 4 * n : 30}%)`)
        this.el.style.setProperty('--c', n < 3 ? '#654' : '#ffe')
        this.el.style.setProperty('--f', `${n < 4 ? 3.5 : n < 7 ? 3 : n < 10 ? 2.5 : n < 14 ? 1.75 : 1.5}rem`)
        this.el.setAttribute('data-n', 2 ** n)
    }

    get n() { return this.#n }
    get el() { return document.getElementById(this.id) }
}

class Game {

    #currentPoints
    #gameOver

    constructor(id) {
        Game.id = id
        Game.el = document.getElementById(id)
        this.init(true)
        // this.load()
    }

    init(withLoad = false) {
        this.#gameOver = false
        this.points = 0

        Game.idCounter = 1
        Game.board = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]


        document.getElementById('game-over').classList.remove('show')

        if (withLoad) {
            this.load()
        } else {
            new Tile
            new Tile
        }


        Game.high = parseInt(localStorage.getItem('highScore'), 10) || 0
    }
    save() {
        if (this.#gameOver) {
            localStorage.removeItem('currentBoard')
            localStorage.removeItem('currentScore')
        } else {
            let board = Game.board.map(row => row.map(e => {
                if (e == 0) { return 0 }
                return e.n
            }))
            localStorage.setItem('currentBoard', JSON.stringify(board))
            localStorage.setItem('currentScore', this.points)
        }
    }
    load() {

        let board = JSON.parse(localStorage.getItem('currentBoard')) || false

        if (!!board) {

            Game.board = board.map(r => r.map(e => {
                if (!e) { return 0 }
                let el = new Tile
                el.n = e
                return el
            }))

            this.update()

            this.points = parseInt(localStorage.getItem('currentScore'), 10) || 0
        } else {
            new Tile
            new Tile
        }
    }
    share() {
        navigator.share({
            text: `I got ${this.points} points! Can you beat that? Play now at:`,
            url: 'https://test.pamaud.com/2048/'
        })
    }
    install() {
        this.style.display = 'none'
        deferredPrompt.prompt()
    }
    end() {
        document.getElementById('game-over').classList.add('show')
        this.#gameOver = true

    }
    play(code) {
        let a = Game.board.flat()
        for (var i = 0; i < code; i++) { this.rotate() }
        Game.board = Game.board.map(Game.handleRow.bind(this))
        for (i = 0; i < (4 - code) % 4; i++) { this.rotate() }
        let b = Game.board.flat()

        if (!!(a.reduce((p, c, i) => p + (c != b[i]), 0))) {
            this.update()
            new Tile
        }

        this.check()
    }
    update() {
        Game.board.forEach((i, ii) => {
            i.forEach((j, ji) => {
                if (!!j) { j.place(ji, ii) }
            })
        })
    }
    rotate() {
        Game.board = Game.board.map(() => {
            let temp = [], e
            for (e of Game.board) { temp.push(e.pop()) }
            return temp
        })
    }
    check() {
        let sum = 0, l = Game.board.length - 1
        Game.board.forEach((i, ii) => {
            i.forEach((j, ji) => {
                if (j != 0) {
                    if (ii > 0 && Game.board[ii - 1][ji] != 0) { sum += Game.board[ii - 1][ji].n == j.n }
                    if (ii < l && Game.board[ii + 1][ji] != 0) { sum += Game.board[ii + 1][ji].n == j.n }
                    if (ji > 0 && Game.board[ii][ji - 1] != 0) { sum += Game.board[ii][ji - 1].n == j.n }
                    if (ji < l && Game.board[ii][ji] + 1 != 0) { sum += Game.board[ii][ji + 1].n == j.n }
                }
            })
        })
        if (!sum && Game.board.flat().filter(e => e != 0).length == Game.board.flat().length) { this.end() }
    }
    reset() {
        this.empty()
        this.init()
    }
    empty() {
        Game.board.forEach(i => {
            i.forEach(j => {
                if (!!j) { j.remove() }
            })
        })
    }

    static handleRow(row) {
        let temp = row.filter(e => e != 0), i
        for (i = 0; i < temp.length - 1; i++) {
            if (temp[i].n != temp[i + 1].n) { continue }
            temp[i].remove()
            temp[i] = temp[i + 1]
            temp[i].upgrade().animate(ANIMATION.PULSE)
            this.points += temp[i].n
            temp[++i] = 0
        }
        temp = temp.filter(e => e != 0)
        temp = temp.concat(Array(row.length - temp.length).fill(0))
        return temp
    }
    static getEmptyTile() {
        let c = false
        while (c ? (Game.board[c[1]][c[0]] != 0) : true) {
            c = [0, 0].map(() => Math.floor(Math.random() * 4))
        }
        return { x: c[0], y: c[1] }
    }

    get points() { return this.#currentPoints }
    set points(n) {
        this.#currentPoints = n

        document.getElementById('current').innerText = n
        if (n > Game.high) { Game.high = n }
    }

    static get high() { return parseInt(localStorage.getItem('highScore'), 10) }
    static set high(n) {
        localStorage.setItem('highScore', n)
        document.getElementById('high').innerText = n
    }

    static id
    static el
    static board
    static idCounter
}

let game = new Game('game')

let touchStart = {}, deferredPrompt


Game.el.onpointerdown = (evt) => {
    touchStart.x = evt.clientX
    touchStart.y = evt.clientY
}
Game.el.onpointerup = (evt) => {
    let dx = touchStart.x - evt.clientX,
        dy = touchStart.y - evt.clientY,
        d = (dx ** 2 < dy ** 2)
    game.play.bind(game)((d ? dy < 0 : dx < 0) * 2 + d)
}

window.onkeyup = (evt) => {
    let key = evt.keyCode - 37
    if (key < 0 || key > 3) { return false }
    game.play.bind(game)(key)
}

document.getElementById('reset-btn').onclick = game.reset.bind(game)
document.getElementById('reset-btn2').onclick = game.reset.bind(game)
document.getElementById('share-btn').onclick = game.share.bind(game)
document.getElementById('share-btn2').onclick = game.share.bind(game)

document.getElementById('install-btn' ).onclick = game.install
document.getElementById('install-btn2').onclick = game.install

window.onbeforeunload = (evt) => { game.save.bind(game)()}
window.onbeforeinstallprompt = (evt) => {
    deferredPrompt = evt
    deferredPrompt.prompt()
    showInstallButtons()
}
window.onappinstalled = () => {document.getElementsByClassName('install-btn').forEach( x => { x.style.display = 'none' })}

let showInstallButtons = () => {
    document.getElementById('install-btn' ).style.display = 'inline-flex'
    document.getElementById('install-btn2').style.display = 'inline-flex'
}

if('serviceWorker' in navigator) { navigator.serviceWorker.register('./sw.js');};

