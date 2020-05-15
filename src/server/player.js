const ObjectClass = require("./object");
const Bullet = require("./bullet");
const constants = require("../shared/constants");
const weaponTypes = require("../shared/ctype/weapons");

class Player extends ObjectClass {
    constructor(id, username, x, y) {
        super(id, x, y, Math.random() * 2 * Math.PI, constants.PLAYER_SPEED);
        this.username = username;
        this.hp = constants.PLAYER_MAX_HP;
        this.fireCooldown = 0;
        this.score = 0;
        this.isFiring = false;
        this.weapon = "basic";
        this.requestPickup = false;
        this.ammunition = {"T108":0,"AP102":0,"B89":0};
    }

    update(dt) {
        super.update(dt);
        this.score += dt * constants.SCORE_PER_SECOND;
        
        this.x = Math.max(0, Math.min(constants.MAP_SIZE, this.x));
        this.y = Math.max(0, Math.min(constants.MAP_SIZE, this.y));
        
        if(this.fireCooldown > 0) {
            this.fireCooldown -= dt*10;
        } else if(this.isFiring && this.ammunition[weaponTypes[this.weapon].meta.ammunition] >= 1) {
            this.fireCooldown += weaponTypes[this.weapon].meta.cooldown;
            let bullets = weaponTypes[this.weapon].fire(this.id, this.x, this.y, this.direction);
            this.ammunition[weaponTypes[this.weapon].meta.ammunition] -= 1;
            return bullets;
        }

        return null;
    }

    takeBulletDamage(bullet, players) {
        this.hp -= bullet.damage;
        if(this.hp <= 0) {
            console.log(`${bullet.parentID} > ${this.id}`);
        }
    }

    onDealtDamage() {
        this.score += constants.SCORE_BULLET_HIT;
    }

    serializeForUpdate() {
        return {
            ...(super.serializeForUpdate()),
            direction: this.direction,
            hp: this.hp,
            username: this.username,
            weapon: this.weapon,
            ammunition: this.ammunition
        };
    }
}

module.exports = Player;