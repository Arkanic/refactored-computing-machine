const constants = require("../shared/constants");
const Player = require("./player");
const applyCollisions = require("./collisions");
const Obtainable = require("./obtainable");

const generateLoot = require("./loot.js");

class Game {
    constructor() {
        this.sockets = {};
        this.players = {};
        this.bullets = [];
        this.obtainables = generateLoot();
        this.lastUpdateTime = Date.now();
        this.shouldSendUpdate = false;
        setInterval(this.update.bind(this), 1000/100);
    }

    addPlayer(socket, username) {
        this.sockets[socket.id] = socket;

        const x = constants.MAP_SIZE * (0.25 + Math.random() * 0.5);
        const y = constants.MAP_SIZE * (0.25 + Math.random() * 0.5);
        this.players[socket.id] = new Player(socket.id, username, x, y);
        console.log(`Player Join (${username}) [${socket.id}]`);
    }

    removePlayer(socket) {
        console.log(`Player leave [${socket.id}]`);
        delete this.sockets[socket.id];
        delete this.players[socket.id];
    }

    handleMouseInput(socket, state) {
        if(this.players[socket.id]) {
            this.players[socket.id].setDirection(state.dir);
            this.players[socket.id].isFiring = state.isFiring;
        }
    }

    handleKeyboardInput(socket, state) {
        if(this.players[socket.id]) {
            this.players[socket.id].requestPickup = state.f;
        }
    }

    update() {
        const now = Date.now();
        const dt = (now - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = now;

        const bulletsToRemove = [];
        this.bullets.forEach(bullet => {
            if(bullet.update(dt)) {
                bulletsToRemove.push(bullet);
            }
        });
        this.bullets = this.bullets.filter(bullet => !bulletsToRemove.includes(bullet));

        this.obtainables.forEach(obtainable => {
            obtainable.update(dt);
        });

        Object.keys(this.sockets).forEach(playerID => {
            const player = this.players[playerID];
            const newBullets = player.update(dt);
            if(newBullets) {
                for(let i in newBullets) {
                    this.bullets.push(newBullets[i]);
                }
            }
        });

        const destroyedBullets = applyCollisions(Object.values(this.players), this.bullets);
        destroyedBullets.forEach(b => {
            if(this.players[b.parentID]) {
                this.players[b.parentID].onDealtDamage();
            }
        });
        this.bullets = this.bullets.filter(bullet => !destroyedBullets.includes(bullet));
        
        const obtainablesToRemove = [];
        Object.keys(this.sockets).forEach(playerID => {
            const socket = this.sockets[playerID];
            const player = this.players[playerID];
            if(player.hp <= 0) {
                socket.emit(constants.MSG_TYPES.GAME_OVER);
                for(let i in player.ammunition) {
                    if(player.ammunition[i] > 0) {
                        this.obtainables.push(new Obtainable(player.x + Math.random()*200-100, player.y + Math.random()*200-100, 0, {type:"ammunition", content:i, amount:player.ammunition[i]}));
                    }
                }
                if(player.weapon != "basic") {
                    this.obtainables.push(new Obtainable(player.x + Math.random()*200-100, player.y + Math.random()*200-100, 0, {type:"weapon", content:player.weapon}));
                }
                this.removePlayer(socket);
            }
            this.obtainables.forEach(obtainable => {
                if(player.requestPickup) {
                    if(player.distanceTo(obtainable) <= 128) {
                        let temp;
                        if(obtainable.content.type == "weapon") {
                            temp = player.weapon;
                            player.weapon = obtainable.content.content;
                            obtainablesToRemove.push(obtainable);
                            this.obtainables.push(new Obtainable(player.x, player.y, 0, {type:"weapon", content:temp}));
                            player.requestPickup = false;
                        } else if(obtainable.content.type == "ammunition") {
                            player.ammunition[obtainable.content.content] += obtainable.content.amount;
                            obtainablesToRemove.push(obtainable);
                            player.requestPickup = false;
                        } else if(obtainable.content.type == "consumable") {
                            player.hp += 50;
                            obtainablesToRemove.push(obtainable);
                            player.requestPickup = false;
                        }
                    }
                }
            });
            this.obtainables = this.obtainables.filter(obtainable => !obtainablesToRemove.includes(obtainable));
        });

        if(this.shouldSendUpdate) {
            const leaderboard = this.getLeaderboard();
            Object.keys(this.sockets).forEach(playerID => {
                const socket = this.sockets[playerID];
                const player = this.players[playerID];
                socket.emit(constants.MSG_TYPES.GAME_UPDATE, this.createUpdate(player, leaderboard));
            });
            this.shouldSendUpdate = false;
        } else {
            this.shouldSendUpdate = true;
        }
    }

    getLeaderboard() {
        return Object.values(this.players)
            .sort((p1, p2) => p2.score - p1.score)
            .slice(0, 5)
            .map(p => ({username: p.username, score: Math.round(p.score)}));
    }

    createUpdate(player, leaderboard) {
        const nearbyPlayers = Object.values(this.players).filter(
            p => p !== player && p.distanceTo(player) <= constants.MAP_SIZE / 2
        );
        const nearbyBullets = this.bullets.filter(
            b => b.distanceTo(player) <= constants.MAP_SIZE / 2
        );
        const nearbyObtainables = this.obtainables.filter(
            o => o.distanceTo(player) <= constants.MAP_SIZE / 2
        );

        return {
            t: Date.now(),
            me: player.serializeForUpdate(),
            others: nearbyPlayers.map(p => p.serializeForUpdate()),
            bullets: nearbyBullets.map(b => b.serializeForUpdate()),
            obtainables: nearbyObtainables.map(o => o.serializeForUpdate()),
            leaderboard
        };
    }
}

module.exports = Game;