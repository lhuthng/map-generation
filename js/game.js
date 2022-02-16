import Phaser from "phaser";

class Example extends Phaser.Scene
{
    constructor ()
    {
        super();
    }

    preload ()
    {
        
    }

    create ()
    {
        this.props = { update: new Set() };
        this.props.container = this.add.container(400, 300);
        this.props.bound = { minX : 0, minY : 0, maxX : 0, maxY : 0 }
        const { container, bound } = this.props;
        container.offset = {
            origin: { x: container.x, y: container.y },
            x: 0, y: 0
        }
        const size = 8, space = 1;
        const blockColor = 0xff0000, emptyColor = 0x00ff00;
        const addRect = (x, y, color) => {
            x *= size + space;
            y *= size + space;
            const maxHeight = 50;
            let height = maxHeight;
            //  maxHeight => 1
            //  height    => ?           1 + (size - 1) * (maxHeight - height) / maxHeight = (?)
            //  0         => 8
            const rect = this.add.rectangle(x, y + height, size, size, color).setOrigin(0.5);
            const fall = () => {
                height = Phaser.Math.Linear(height, 0, 0.1);
                if (height < 0.1) {
                    height = 0;
                    this.props.update.delete(fall);
                }
                rect.setY(y + height);
                const rectSize = 1 + (size - 1) * (maxHeight - height) / maxHeight;
                rect.setSize(size, rectSize);
            };
            this.props.update.add(fall);
            bound.minX = Math.min(x, bound.minX);
            bound.minY = Math.min(y, bound.minY);
            bound.maxX = Math.max(x, bound.maxX);
            bound.maxY = Math.max(y, bound.maxY);
            container.add(rect);
            return rect;
        }
        const convert = (x, y) => (x + 50000) * 100000 + y + 50000;
        const storage = { };
        const setCell = (x, y, color) => {
            const hash = convert(x, y);
            if (storage[hash] === undefined) storage[hash] = addRect(x, y, color);
            else {
                const rect = storage[hash];
                if (rect.fillColor !== color) {
                    rect.___isShifting = true;
                    const rgb = (color) => [color >> 16, (color >> 8) & 0xff, color & 0xff];
                    const [targetRed, targetGreen, targetBlue] = rgb(color);
                    const shiftColor = () => {
                        let [red, green, blue] = rgb(rect.fillColor);
                        red = Phaser.Math.Linear(red, targetRed, 0.1);
                        green = Phaser.Math.Linear(green, targetGreen, 0.1);
                        blue = Phaser.Math.Linear(blue, targetBlue, 0.1);
                        if (Math.abs(red - targetRed) < 10 && Math.abs(blue - targetBlue) < 10 && Math.abs(green - targetGreen) < 10) {
                            [red, green, blue] = [targetRed, targetGreen, targetBlue];
                            this.props.update.delete(shiftColor);
                        }
                        rect.fillColor = (((red << 8) | green) << 8) | blue;
                    }
                    this.props.update.add(shiftColor);
                }
                // storage[hash].fillColor = color;
            }
            return storage[hash];
        }
        const getCell = (x, y) => storage[convert(x, y)];
        [-1, 0, 1].forEach(x => [-1, 0, 1].forEach(y => setCell(x, y, blockColor)));
        setCell(0, 0, emptyColor);
        const queue = [];
        const emptyQueue = [];
        [-1, 1].forEach(d => queue.push({ dx: d }, { dy: d }));
        const valuesOrZero = (...vs) => vs.map(v => v || 0);
        const expand = (args) => {
            if (args === undefined) return;
            let { x, y, dx, dy } = args;
            [x, y, dx, dy] = valuesOrZero(x, y, dx, dy);
            const tryPush = (dx, dy) => {
                if (getCell(x + dx, y + dy) === undefined) {
                    setCell(x + dx, y + dy, blockColor);
                    queue.push({ x, y, dx, dy });
                }
                else {
                    setCell(x + dx, y + dy, emptyColor);
                    emptyQueue.push({ x: x + dx, y: y + dy });
                }
            }
            x = x + dx * 2;
            y = y + dy * 2;
            if (getCell(x, y) === undefined) {
                setCell(x, y, emptyColor);
                emptyQueue.push({ x, y });
                [-1, 1].forEach(dx => [-1, 1].forEach(dy => getCell(x + dx, y + dy) === undefined && setCell(x + dx, y + dy, blockColor)));
                [-1, 1].forEach(d => { tryPush(d, 0); tryPush(0, d); });
            }
        }
        let limit = 333;
        let trigger = () => {
            if (limit < 0) {
                console.log(limit, emptyQueue.length);
                return;
            }
            limit--;
            const deleteRandom = () => {
                if (Math.random() < 0.5) {
                    const i = (Math.random() * queue.length / 2) >> 0;
                    queue.splice(i, 1);
                }
            }
            while (queue.length > 15 && Math.random() > 0.1) deleteRandom();
            const idx = (Math.random() * queue.length) >> 0;
            const random = queue[idx];
            expand(random);
            queue.splice(idx, 1);
        }
        const timer = this.time.addEvent({
            delay: 40,
            callback: () => trigger(),
            callbackScope: this,
            loop: true
        });
        timer.paused = true;
        this.input.keyboard.on('keydown', event => {
            timer.paused = false;
        })
    }
    update() {
        const { container, bound, update } = this.props;
        const { minX, minY, maxX, maxY } = bound;
        const { offset } = container;
        offset.x = Phaser.Math.Linear(offset.x, -(minX + maxX) / 2, 0.01);
        offset.y = Phaser.Math.Linear(offset.y, -(minY + maxY) / 2, 0.01);
        container.x = offset.origin.x + offset.x;
        container.y = offset.origin.y + offset.y;
        update.forEach(callback => callback());
    }
}
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#2d2d2d',
    parent: 'phaser-example',
    scene: [ Example ]
};

const game = new Phaser.Game(config);
