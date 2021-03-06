const shortid = require("shortid");
const ObjectClass = require("./object");
const constants = require("../shared/constants");

class Bullet extends ObjectClass {
    constructor(parentID, x, y, dir, meta) {
        super(shortid(), x, y, dir, meta.speed);
        this.parentID = parentID;
        this.lifetime = meta.lifetime;
        this.radius = meta.radius;
        this.damage = meta.damage;
        this.px = x;
        this.py = y;
    }

    update(dt) {
        this.px = this.x;
        this.py = this.y;
        super.update(dt);
        this.lifetime -= 1 * dt;
        if(this.x < 0 || this.x > constants.MAP_SIZE || this.y < 0 || this.y > constants.MAP_SIZE) {
            return true;
        } else if(this.lifetime <= 0) {
            return true;
        }
    }

    serialize() {
        return {
            ...(super.serialize()),
            radius: this.radius,
            px: this.px,
            py: this.py
        };
    }
}

module.exports = Bullet;