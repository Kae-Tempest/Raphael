const { raphael } = require('../Structures/database/connect');
module.exports = (client) => {
	client.getGuild = async (guild) => {
		const data = await raphael.query(`select * from guild where GUILD_ID = ${guild}`).then((rows, err) => {
			if (err) throw err;
			return rows;
		});
		if (data) return data[0];
	};
	client.getPrefix = async (guildID) => {
		return await raphael.query(`select prefix from guild where GUILD_ID = ${guildID}`).then((rows, err) => {
			if (err) throw err;
			return rows[0];
		});
	};
	client.setPrefix = async (prefix, guildID) => {
		await raphael.query(`update guild set prefix = '${prefix}' where GUILd_ID = ${guildID}`).then((rows, err) => {
			if (err) throw err;
			return rows;
		});
	};
	client.getUser = async (member, guild) => {
		const guilds = guild ? await client.getGuild(guild.id) : await client.getGuild(member.guild.id);
		const guildID = guilds['GUILD_ID'];
		const user = await raphael
			.query(
				`
            select user.USER_ID, user.GUILD_ID,
            user.CLASSES, user.RACE, user.INTELLIGENCE, user.ESPRIT, user.AGILITY, user.VITALITY, user.CONSTITUTION, user.ATTAQUE,
            user.PO, user.EXP, user.LEVEL, user.PTC,
            equipement.HELMET, equipement.PLASTRON, equipement.PANTALON, equipement.BOTTES, equipement.MH, equipement.OH,
            equipement.RINGS, equipement.EARRINGS, equipement.BELT, equipement.BROACH
            from user
            inner join equipement on user.USER_ID = equipement.USER_ID  
            where user.GUILD_ID = ${guildID}
            and user.USER_ID = ${member.id}
            `
			)
			.then((rows, err) => {
				if (err) throw err;
				return rows;
			});
		if (user) return user[0];
	};
	client.getAllDataUser = async (member) => {
		const user = await raphael
			.query(
				`
            select user.USER_ID, user.GUILD_ID,
            user.CLASSES, user.RACE, user.INTELLIGENCE, user.ESPRIT, user.AGILITY, user.VITALITY, user.CONSTITUTION, user.ATTAQUE,
            user.PO, user.EXP, user.LEVEL, user.PTC,
            equipement.HELMET, equipement.PLASTRON, equipement.PANTALON, equipement.BOTTES, equipement.MH, equipement.OH,
            equipement.RINGS, equipement.EARRINGS, equipement.BELT, equipement.BROACH
            from user
            inner join equipement on user.USER_ID = equipement.USER_ID  
            where user.USER_ID = ${member.id}
            `
			)
			.then((rows, err) => {
				if (err) throw err;
				return rows;
			});
		if (user) return user[0];
	};
	client.updateUserInfo = async (memberid, po, exp, lvl, message) => {
		if (!po) po = 0;
		if (!exp) exp = 0;
		if (!lvl) lvl = 0;
		let user = await raphael.query(`select * from user where USER_ID = ${memberid}`).then((rows, err) => {
			if (err) throw err;
			return rows;
		});
		if (user === undefined) return message.reply('user not found');
		user = user[0];
		const PO = user['PO'] + po;
		const EXP = user['EXP'] + exp;
		const LVL = user['LEVEL'] + lvl;
		const updatedInfo = await raphael.query(`update user set PO = ${PO}, EXP = ${EXP}, LEVEL = ${LVL}`).then((rows, err) => {
			if (err) throw err;
			return rows;
		});
		if (!updatedInfo) console.log('Update User Error !');
		const updatedUserInfo = await raphael.query(`select * from user where USER_ID = ${memberid}`);
		if (updatedUserInfo) return updatedUserInfo[0];
	};
	client.getInventory = async (member, guild) => {
		const user = guild ? await client.getUser(member, guild) : await client.getUser(member);
		const inventory = await raphael.query(`select * from inventaire where USER_ID = ${user['USER_ID']}`).then((rows, err) => {
			if (err) throw err;
			return rows;
		});
		if (inventory) return inventory;
	};
	client.getAllUserInventory = async (member) => {
		const inventory = await raphael.query(`select * from inventaire where USER_ID = ${member['USER_ID'] ?? member.id}`).then((rows, err) => {
			if (err) throw err;
			return rows;
		});
		if (inventory) return inventory;
	};
	client.addInventory = async (item, quantiy, member, guild) => {
		const user = guild ? await client.getUser(member, guild) : await client.getUser(member);
		const Inventory = await client.getInventory(member);
		const HaveItem = Inventory.find((items) => items['ITEM_NAME'] === item);
		const items = await client.getItem(item);
		if (!HaveItem) {
			const addItem = await raphael
				.query(
					`insert into inventaire (USER_ID, ITEM_NAME, CRAFT_ITEM_ID, QUANTITY) 
values (${user['USER_ID']}, "${item}", ${items['ID'] === undefined ? null : items['ID']}, ${quantiy})`
				)
				.then((rows, err) => {
					if (err) throw err;
					return rows;
				});
			if (!addItem) return console.log('Add Item Error !');
		} else if (HaveItem['QUANTITY'] >= 1) {
			const addItem = await raphael.query(`update inventaire set QUANTITY = ${HaveItem['QUANTITY']} + ${quantiy} where ITEM_NAME = '${item}'`).then((rows, err) => {
				if (err) throw err;
				return rows;
			});
			if (!addItem) return console.log('Add Item Error !');
		}
		const inventory = client.getInventory(member, guild);
		if (inventory) return inventory;
	};
	client.removeInventory = async (item, quantity, member, guild) => {
		const user = guild ? await client.getUser(member, guild) : await client.getUser(member);
		const Inventory = await client.getInventory(member);
		const HaveItem = Inventory.find((items) => items['ITEM_NAME'] === item);
		if (HaveItem['QUANTITY'] > 1) {
			const removeItem = await raphael.query(`update inventaire set QUANTITY = ${HaveItem['QUANTITY']} - ${quantity} where ITEM_NAME = '${item}'`).then((rows, err) => {
				if (err) throw err;
				return rows;
			});
			if (!removeItem) return console.log('Remove Item Error !');
		} else if (HaveItem['QUANTITY'] === 1) {
			if (item['CRAFT_ITEM_ID'] !== null) {
				const removeCraftItem = await raphael.query(`delete from craftitem where USER_ID = ${user['USER_ID']} and ITEM_NAME = '${item}' and ID = ${HaveItem['CRAFT_ITEM_ID']}`).then((rows, err) => {
					if (err) throw err;
					return rows;
				});
				if (!removeCraftItem) return console.log('Remove Item Error !');
			}
			const removeItem = await raphael.query(`delete from inventaire where USER_ID = ${user['USER_ID']} and ITEM_NAME = "${item}" order by ID DESC limit 1`).then((rows, err) => {
				if (err) throw err;
				return rows;
			});
			if (!removeItem) return console.log('Remove Item Error !');
		}
		const inventory = client.getInventory(member, guild);
		if (inventory) return inventory;
	};
	client.updateInventoryUserItem = async (item, user, receiver) => {
		const Userinventory = await client.getAllUserInventory(user);
		const receiverInventory = await client.getAllUserInventory(receiver);
		let ItemData = await client.getItem(item);
		const UserHaveItem = Userinventory.find((items) => items['ITEM_NAME'] === ItemData['ITEM_NAME']);
		const receiverHaveItem = receiverInventory.find((items) => items['ITEM_NAME'] === ItemData['ITEM_NAME']);
		if (!Userinventory) {
			return await raphael
				.query(
					`update inventaire
                                        set USER_ID = ${receiver.id}
                                        where ITEM_NAME = '${item}'
                                          and USER_ID = ${user.id}`
				)
				.then((rows, err) => {
					if (err) throw err;
					return rows;
				});
		}
		if (UserHaveItem['QUANTITY'] > 1) {
			await raphael
				.query(
					`update inventaire
                                 set QUANTITY = ${UserHaveItem['QUANTITY'] - 1}
                                 where USER_ID = ${user.id}
                                   and ITEM_NAME = '${item}'`
				)
				.then((rows, err) => {
					if (err) throw err;
					return rows;
				});
			if (receiverHaveItem) {
				if (receiverHaveItem['QUANTITY'] >= 1) {
					await raphael
						.query(
							`update inventaire
                                         set QUANTITY = ${receiverHaveItem['QUANTITY'] + 1}
                                         where USER_ID = ${receiver.id}
                                           and ITEM_NAMe = '${item}'`
						)
						.then((rows, err) => {
							if (err) throw err;
							return rows;
						});
				}
			} else if (UserHaveItem['QUANTITY'] === 1) {
				await raphael
					.query(
						`update inventaire
                                     set USER_ID = ${receiver.id}
                                     where ITEM_NAME = '${item}'
                                       and USER_ID = ${user.id}`
					)
					.then((rows, err) => {
						if (err) throw err;
						return rows;
					});
			} else {
				let items = await client.getItem(item);
				await raphael
					.query(
						`insert into inventaire (USER_ID, ITEM_NAME, CRAFT_ITEM_ID, QUANTITY)
                                         values (${receiver.id}, "${item}",
                                                 ${items['ID'] === undefined ? null : items['ID']}, 1)`
					)
					.then((rows, err) => {
						if (err) throw err;
						return rows;
					});
			}
		}
	};
	client.getItem = async (item) => {
		const itemInfo = await raphael.query(`select * from items where ITEM_NAME = "${item}"`).then((rows, err) => {
			if (err) throw err;
			return rows;
		});
		const craftItemInfo = await raphael.query(`select * from craftitem where ITEM_NAME = "${item}"`).then((rows, err) => {
			if (err) throw err;
			return rows;
		});
		if (itemInfo[0]) return itemInfo[0];
		else if (craftItemInfo[0]) return craftItemInfo[0];
	};
	client.getAllItem = async () => {
		let items = await raphael.query(`select ITEM_NAME from items`).then((rows, err) => {
			if (err) throw err;
			return rows;
		});
		if (items) return items;
	};
	client.createItem = async (name, attaque, constitution, vitality, agility, intelligence, esprit, emplacement, price, message) => {
		if (name === undefined) return message.reply('Missing Data');
		if (attaque === undefined) return message.reply('Missing Data');
		if (constitution === undefined) return message.reply('Missing Data');
		if (vitality === undefined) return message.reply('Missing Data');
		if (agility === undefined) return message.reply('Missing Data');
		if (intelligence === undefined) return message.reply('Missing Data');
		if (esprit === undefined) return message.reply('Missing Data');
		if (price === undefined) return message.reply('Missing Data');
		if (emplacement === undefined) return message.reply('Missing Data');
		const itemInfo = await client.getItem(name);
		if (itemInfo !== undefined) return message.reply('Item already exist');
		const newItem = await raphael
			.query(
				`insert into items 
            (ITEM_NAME, ATTAQUE, CONSTITUTION, VITALITY, AGILITY, INTELLIGENCE, ESPRIT, PRICE ,EMPLACEMENT) 
            values ("${name}", ${attaque}, ${constitution}, ${vitality}, ${agility}, ${intelligence}, ${esprit},${price}, "${emplacement}")
            `
			)
			.then((rows, err) => {
				if (err) throw err;
				return rows;
			});
		if (newItem) return newItem;
		const itemInfos = await client.getItem(name);
		if (itemInfos) return itemInfos;
	};
	client.addEquipement = async (item, member, guild, message) => {
		const user = guild ? await client.getUser(member, guild) : await client.getUser(member);
		const itemInfo = await client.getItem(item);
		const emplacement = itemInfo['EMPLACEMENT'];
		if (!emplacement) message.reply("Weapon does't exist");
		const userInventory = await client.getInventory(member, guild);
		const haveItem = userInventory.find((itemName) => itemName['ITEM_NAME'] === item);
		if (haveItem === undefined) return message.reply('Missing Items in your Inventory');
		const EmplacementName = await client.getColumnName('equipement');
		if (EmplacementName.filter((n) => n === 'HELMET')[0] === emplacement) {
			if (user['HELMET'] !== 'vide') {
				await client.replaceEquipement(user['HELMET'], item, member, guild, emplacement);
			} else {
				await raphael.query(`update equipement set HELMET = '${item}'`).then((rows, err) => {
					if (err) throw err;
					return rows;
				});
			}
		} else if (EmplacementName.filter((n) => n === 'PLASTRON')[0] === emplacement) {
			if (user['PLASTRON'] !== 'vide') {
				await client.replaceEquipement(user['PLASTRON'], item, member, guild, emplacement);
			} else {
				await raphael.query(`update equipement set PLASTRON = '${item}'`).then((rows, err) => {
					if (err) throw err;
					return rows;
				});
			}
		} else if (EmplacementName.filter((n) => n === 'PANTALON')[0] === emplacement) {
			if (user['PANTALON'] !== 'vide') {
				await client.replaceEquipement(user['PANTALON'], item, member, guild, emplacement);
			} else {
				await raphael.query(`update equipement set PANTALON = '${item}'`).then((rows, err) => {
					if (err) throw err;
					return rows;
				});
			}
		} else if (EmplacementName.filter((n) => n === 'BOTTES')[0] === emplacement) {
			if (user['BOTTES'] !== 'vide') {
				await client.replaceEquipement(user['BOTTES'], item, member, guild, emplacement);
			} else {
				await raphael.query(`update equipement set BOTTES = '${item}'`).then((rows, err) => {
					if (err) throw err;
					return rows;
				});
			}
		} else if (EmplacementName.filter((n) => n === 'MH')[0] === emplacement) {
			if (user['MH'] !== 'vide') {
				await client.replaceEquipement(user['MH'], item, member, guild, emplacement);
			} else {
				await raphael.query(`update equipement set MH = '${item}'`).then((rows, err) => {
					if (err) throw err;
					return rows;
				});
			}
		} else if (EmplacementName.filter((n) => n === 'OH')[0] === emplacement) {
			if (user['OH'] !== 'vide') {
				await client.replaceEquipement(user['OH'], item, member, guild, emplacement);
			} else {
				await raphael.query(`update equipement set OH = '${item}'`).then((rows, err) => {
					if (err) throw err;
					return rows;
				});
			}
		} else if (EmplacementName.filter((n) => n === 'RINGS')[0] === emplacement) {
			if (user['RINGS'] !== 'vide') {
				await client.replaceEquipement(user['RINGS'], item, member, guild, emplacement);
			} else {
				await raphael.query(`update equipement set rings = '${item}'`).then((rows, err) => {
					if (err) throw err;
					return rows;
				});
			}
		} else if (EmplacementName.filter((n) => n === 'BROACH')[0] === emplacement) {
			if (user['BROACH'] !== 'vide') {
				await client.replaceEquipement(user['BROACH'], item, member, guild, emplacement);
			} else {
				await raphael.query(`update equipement set broach = '${item}'`).then((rows, err) => {
					if (err) throw err;
					return rows;
				});
			}
		} else if (EmplacementName.filter((n) => n === 'BELT')[0] === emplacement) {
			if (user['BELT'] !== 'vide') {
				await client.replaceEquipement(user['BELT'], item, member, guild, emplacement);
			} else {
				await raphael.query(`update equipement set belt = '${item}'`).then((rows, err) => {
					if (err) throw err;
					return rows;
				});
			}
		} else if (EmplacementName.filter((n) => n === 'EARRINGS')[0] === emplacement) {
			if (user['EARRINGS'] !== 'vide') {
				await client.replaceEquipement(user['EARRINGS'], item, member, guild, emplacement);
			} else {
				await raphael.query(`update equipement set earrings = '${item}'`).then((rows, err) => {
					if (err) throw err;
					return rows;
				});
			}
		}
		await client.removeInventory(item, member, guild);
		const updateUserInfo = guild ? await client.getUser(member, guild) : await client.getUser(member);
		if (updateUserInfo) return updateUserInfo[0];
	};
	client.getColumnName = async (table) => {
		const column = await raphael.query(`select COLUMN_NAME from INFORMATION_SCHEMA.COLUMNS where table_name = "${table}"`).then((rows, res, err) => {
			if (err) throw err;
			return rows;
		});
		const columnName = column.map((c) => c['COLUMN_NAME']);
		if (columnName) return columnName;
	};
	client.replaceEquipement = async (equipItem, InventoryItem, member, guild, emplacement) => {
		await client.removeEquipement(equipItem, emplacement, member, guild);
		await client.addEquipement(InventoryItem, member, guild);
	};
	client.removeEquipement = async (item, emplacement, member, guild, message) => {
		const user = guild ? await client.getUser(member, guild) : await client.getUser(member);
		if (user[`${emplacement}`] === 'vide') return message.reply('Any Item Equiped');
		const removeEquipement = await raphael.query(`update equipement set ${emplacement} = 'vide' where USER_ID = ${user['USER_ID']}`).then((rows, err) => {
			if (err) throw err;
			return rows;
		});
		await client.addInventory(item, member, guild);
		if (removeEquipement) return removeEquipement;
	};
	client.removeItem = async (name, message) => {
		const item = await client.getItem(name);
		if (!item) return message.reply("Item doesn't exist");
		await raphael.query(`delete from items where ITEM_NAME = '${name}'`);
	};
	client.getMonster = async (monster) => {
		const monsterInfo = await raphael.query(`select * from monster where MONSTER_NAME = '${monster}'`).then((rows, err) => {
			if (err) throw err;
			return rows;
		});
		if (monsterInfo) return monsterInfo[0];
	};
	client.createMonster = async (name, attaque, constitution, vitality, agility, intelligence, loot, po, exp, message) => {
		if (name === undefined) return client.reply('Missing Data');
		if (attaque === undefined) return message.reply('Missing Data');
		if (constitution === undefined) return message.reply('Missing Data');
		if (vitality === undefined) return message.reply('Missing Data');
		if (agility === undefined) return message.reply('Missing Data');
		if (intelligence === undefined) return message.reply('Missing Data');
		if (loot === undefined) return message.reply('Missing Data');
		if (po === undefined) return message.reply('Missing Data');
		if (exp === undefined) return message.reply('Missing Data');
		const monsterInfo = await client.getMonster(name);
		if (monsterInfo !== undefined) if (monsterInfo['MONSTER_NAME'] === name) return message.reply('Monster already exist');
		const newMonster = await raphael
			.query(
				`insert into monster (MONSTER_NAME, ATTAQUE, CONSTITUTION, VITALITY, AGILITY, INTELLIGENCE, LOOT, PO, EXP)
                values ('${name}', ${attaque}, ${constitution} , ${vitality}, ${agility}, ${intelligence}, '${JSON.stringify(loot)}', ${po}, ${exp})`
			)
			.then((rows, err) => {
				if (err) throw err;
				return rows;
			});
		if (newMonster) return newMonster;
	};
	client.removeMonster = async (name, message) => {
		const monster = await client.getMonster(name);
		if (!monster) return message.reply("Monster doesn't exist");
		await raphael.query(`delete from monster where MONSTER_NAME = '${name}'`);
	};
	client.createUserInfo = async (member, classe, race, message) => {
		const userInfo = await client.getUser(member, member.guild);
		if (userInfo && userInfo['RACE'] !== 'null' && userInfo['CLASSES'] !== 'null') return;
		const user = await raphael
			.query(
				`insert into user (USER_ID, GUILD_ID, CLASSES, RACE, INTELLIGENCE, ESPRIT, AGILITY, VITALITY, CONSTITUTION, ATTAQUE, PO, EXP, LEVEL, PTC)
            values (${member.id}, ${message.guildId}, '${classe}', '${race}',
                    0,0,0,0,0,0,
                    50, 0, 1, 0)`
			)
			.then((rows, err) => {
				if (err) throw err;
				return rows;
			});
		const equipement = await raphael.query(`insert into equipement values (${member.id}, 'vide', 'vide', 'vide', 'vide', 'vide', 'vide', 'vide', 'vide', 'vide', 'vide')`).then((rows, err) => {
			if (err) throw err;
			return rows;
		});
		if (user) return console.log('User Create !');
		if (equipement) return console.log('Equipement User Create !');
	};
	client.getClasse = async (classe) => {
		const classeInfo = await raphael.query(`select * from classes where NAME = '${classe}'`).then((rows, err) => {
			if (err) throw err;
			return rows;
		});
		if (classeInfo) return classeInfo[0];
	};
	client.createClasse = async (name, attaque, constitution, intelligence, esprit, agility, vitality, message) => {
		if (name === undefined) return message.reply('Missing Data');
		if (attaque === undefined) return message.reply('Missing Data');
		if (constitution === undefined) return message.reply('Missing Data');
		if (intelligence === undefined) return message.reply('Missing Data');
		if (esprit === undefined) return message.reply('Missing Data');
		if (agility === undefined) return message.reply('Missing Data');
		if (vitality === undefined) return message.reply('Missing Data');
		const classes = await client.getClasse(name);
		if (classes) return message.reply('Classe already exist !');
		await raphael.query(`insert into classes values ('${name}', ${attaque}, ${constitution}, ${intelligence}, ${esprit}, ${agility}, ${vitality})`).then((rows, err) => {
			if (err) throw err;
			return rows;
		});
	};
	client.removeClasse = async (name, message) => {
		const classe = await client.getClasse(name);
		if (!classe) return message.reply("Classe doesn't exist");
		await raphael.query(`delete from classes where NAME = '${name}'`).then((rows, err) => {
			if (err) throw err;
			return rows;
		});
	};
	client.getRace = async (name) => {
		const race = await raphael.query(`select * from races where NAME = '${name}'`).then((rows, err) => {
			if (err) throw err;
			return rows;
		});
		if (race) return race[0];
	};
	client.createRace = async (name, attaque, constitution, intelligence, esprit, agility, vitality, message) => {
		if (name === undefined) return message.reply('Missing Data');
		if (attaque === undefined) return message.reply('Missing Data');
		if (constitution === undefined) return message.reply('Missing Data');
		if (intelligence === undefined) return message.reply('Missing Data');
		if (esprit === undefined) return message.reply('Missing Data');
		if (agility === undefined) return message.reply('Missing Data');
		if (vitality === undefined) return message.reply('Missing Data');
		const raceInfo = await client.getRace(name);
		if (raceInfo) return message.reply('Race already exist');
		const race = await raphael.query(`insert into races values ('${name}', ${attaque}, ${constitution}, ${intelligence}, ${esprit}, ${agility}, ${vitality})`).then((rows, err) => {
			if (err) throw err;
			return rows;
		});
		if (race) return race;
	};
	client.removeRace = async (name, message) => {
		const race = await client.getRace(name);
		if (!race) return message.reply("Race doesn't exist");
		await raphael.query(`delete from races where NAME = '${name}'`).then((rows, err) => {
			if (err) throw err;
			return rows;
		});
	};
	client.getStats = async (member, guild) => {
		const user = guild ? await client.getUser(member, guild) : await client.getUser(member);
		const race = await client.getRace(user['RACE']);
		const helmetStat = await client.getItem(user['HELMET']);
		let helmetAtk, helmetConsti, helmetIntel, helmetEsp, helmetAgi, helmetVita;
		if (helmetStat !== undefined) {
			helmetAtk = helmetStat['ATTAQUE'];
			helmetConsti = helmetStat['CONSTITUTION'];
			helmetIntel = helmetStat['INTELLIGENCE'];
			helmetEsp = helmetStat['ESPRIT'];
			helmetAgi = helmetStat['AGILITY'];
			helmetVita = helmetStat['VITALITY'];
		} else helmetAtk = helmetConsti = helmetIntel = helmetEsp = helmetAgi = helmetVita = 0;
		const plastronStat = await client.getItem(user['PLASTRON']);
		let plastronAtk, plastronConsti, plastronIntel, plastronEsp, plastronAgi, plastronVita;
		if (plastronStat !== undefined) {
			plastronAtk = plastronStat['ATTAQUE'];
			plastronConsti = plastronStat['CONSTITUTION'];
			plastronIntel = plastronStat['INTELLIGENCE'];
			plastronEsp = plastronStat['ESPRIT'];
			plastronAgi = plastronStat['AGILITY'];
			plastronVita = plastronStat['VITALITY'];
		} else plastronAtk = plastronConsti = plastronIntel = plastronEsp = plastronAgi = plastronVita = 0;
		const pantalonStat = await client.getItem(user['PANTALON']);
		let pantAtk, pantConsti, pantIntel, pantEsp, pantAgi, pantVita;
		if (pantalonStat !== undefined) {
			pantAtk = pantalonStat['ATTAQUE'];
			pantConsti = pantalonStat['CONSTITUTION'];
			pantIntel = pantalonStat['INTELLIGENCE'];
			pantEsp = pantalonStat['ESPRIT'];
			pantAgi = pantalonStat['AGILITY'];
			pantVita = pantalonStat['VITALITY'];
		} else pantAtk = pantConsti = pantIntel = pantEsp = pantAgi = pantVita = 0;
		const bottesStat = await client.getItem(user['BOTTES']);
		let bottesAtk, bottesConsti, bottesIntel, bottesEsp, bottesAgi, bottesVita;
		if (bottesStat !== undefined) {
			bottesAtk = bottesStat['ATTAQUE'];
			bottesConsti = bottesStat['CONSTITUTION'];
			bottesIntel = bottesStat['INTELLIGENCE'];
			bottesEsp = bottesStat['ESPRIT'];
			bottesAgi = bottesStat['AGILITY'];
			bottesVita = bottesStat['VITALITY'];
		} else bottesAtk = bottesConsti = bottesIntel = bottesEsp = bottesAgi = bottesVita = 0;
		const ringsStat = await client.getItem(user['RINGS']);
		let ringsAtk, ringsConsti, ringsIntel, ringsEsp, ringsAgi, ringsVita;
		if (ringsStat !== undefined) {
			ringsAtk = ringsStat['ATTAQUE'];
			ringsConsti = ringsStat['CONSTITUTION'];
			ringsIntel = ringsStat['INTELLIGENCE'];
			ringsEsp = ringsStat['ESPRIT'];
			ringsAgi = ringsStat['AGILITY'];
			ringsVita = ringsStat['VITALITY'];
		} else ringsAtk = ringsConsti = ringsIntel = ringsEsp = ringsAgi = ringsVita = 0;
		const earringsStat = await client.getItem(user['EARRINGS']);
		let earringsAtk, earringsConsti, earringsIntel, earringsEsp, earringsAgi, earringsVita;
		if (earringsStat !== undefined) {
			earringsAtk = earringsStat['ATTAQUE'];
			earringsConsti = earringsStat['CONSTITUTION'];
			earringsIntel = earringsStat['INTELLIGENCE'];
			earringsEsp = earringsStat['ESPRIT'];
			earringsAgi = earringsStat['AGILITY'];
			earringsVita = earringsStat['VITALITY'];
		} else earringsAtk = earringsConsti = earringsIntel = earringsEsp = earringsAgi = earringsVita = 0;
		const broachStat = await client.getItem(user['BROACH']);
		let broachAtk, broachConsti, broachIntel, broachEsp, broachAgi, broachVita;
		if (broachStat !== undefined) {
			broachAtk = broachStat['ATTAQUE'];
			broachConsti = broachStat['CONSTITUTION'];
			broachIntel = broachStat['INTELLIGENCE'];
			broachEsp = broachStat['ESPRIT'];
			broachAgi = broachStat['AGILITY'];
			broachVita = broachStat['VITALITY'];
		} else broachAtk = broachConsti = broachIntel = broachEsp = broachAgi = broachVita = 0;
		const betlStat = await client.getItem(user['BELT']);
		let beltAtk, beltConsti, beltIntel, beltEsp, beltAgi, beltVita;
		if (betlStat !== undefined) {
			beltAtk = betlStat['ATTAQUE'];
			beltConsti = betlStat['CONSTITUTION'];
			beltIntel = betlStat['INTELLIGENCE'];
			beltEsp = betlStat['ESPRIT'];
			beltAgi = betlStat['AGILITY'];
			beltVita = betlStat['VITALITY'];
		} else beltAtk = beltConsti = beltIntel = beltEsp = beltAgi = beltVita = 0;
		const mainHandStat = await client.getItem(user['MH']);
		let MHAtk, MHConsti, MHIntel, MHEsp, MHAgi, MHVita;
		if (mainHandStat !== undefined) {
			MHAtk = mainHandStat['ATTAQUE'];
			MHConsti = mainHandStat['CONSTITUTION'];
			MHIntel = mainHandStat['INTELLIGENCE'];
			MHEsp = mainHandStat['ESPRIT'];
			MHAgi = mainHandStat['AGILITY'];
			MHVita = mainHandStat['VITALITY'];
		} else MHAtk = MHConsti = MHIntel = MHEsp = MHAgi = MHVita = 0;
		const offHandStat = await client.getItem(user['OH']);
		let OHAtk, OHConsti, OHIntel, OHEsp, OHAgi, OHVita;
		if (offHandStat !== undefined) {
			OHAtk = offHandStat['ATTAQUE'];
			OHConsti = offHandStat['CONSTITUTION'];
			OHIntel = offHandStat['INTELLIGENCE'];
			OHEsp = offHandStat['ESPRIT'];
			OHAgi = offHandStat['AGILITY'];
			OHVita = offHandStat['VITALITY'];
		} else OHAtk = OHConsti = OHIntel = OHEsp = OHAgi = OHVita = 0;

		const ATTAQUE = race['ATTAQUE'] + helmetAtk + plastronAtk + pantAtk + bottesAtk + ringsAtk + earringsAtk + beltAtk + broachAtk + MHAtk + OHAtk;
		const CONSTITUTION = race['CONSTITUTION'] + helmetConsti + plastronConsti + pantConsti + bottesConsti + ringsConsti + earringsConsti + beltConsti + broachConsti + MHConsti + OHConsti;
		const INTELLIGENCE = race['INTELLIGENCE'] + helmetIntel + plastronIntel + pantIntel + bottesIntel + ringsIntel + earringsIntel + beltIntel + broachIntel + MHIntel + OHIntel;
		const ESPRIT = race['ESPRIT'] + helmetEsp + plastronEsp + pantEsp + bottesEsp + ringsEsp + earringsEsp + beltEsp + broachEsp + MHEsp + OHEsp;
		const AGILITY = race['AGILITY'] + helmetAgi + plastronAgi + pantAgi + bottesAgi + ringsAgi + earringsAgi + beltAgi + broachAgi + MHAgi + OHAgi;
		const VITALITY = race['VITALITY'] + helmetVita + plastronVita + pantVita + bottesVita + ringsVita + earringsVita + beltVita + broachVita + MHVita + OHVita;

		return { ATTAQUE, CONSTITUTION, INTELLIGENCE, ESPRIT, AGILITY, VITALITY };
	};
	client.updateCompetence = async (competence, points, member, guild, message) => {
		if (points === isNaN) return message.reply('You need number');
		const user = guild ? await client.getUser(member, guild) : await client.getUser(member);
		if (user['PTC'] === 0) return message.reply("You don't have points");
		if (user['PTC'] < points) return message.reply("You don't have enough points");
		const userAttribut = user[`${competence.toUpperCase()}`];
		if (userAttribut === undefined) return message.reply('Attribut unknow');
		const newUserAttribut = userAttribut + points;
		await raphael.query(`update user set ${competence.toUpperCase()} = ${newUserAttribut} where USER_ID = ${user['USER_ID']}`).then((rows, err) => {
			if (err) throw err;
			message.reply('Competence point added');
			return rows;
		});
		await raphael.query(`update user set PTC = PTC - ${points} where USER_ID = ${user['USER_ID']}`);
	};
	client.getUserName = async (client, guildid, userid) => {
		const username = client.guilds.resolve(guildid).members.resolve(userid).user.username;
		if (username) return username;
	};
	client.getCraftItem = async (itemName, message) => {
		const craftItem = require('../assets/data/blueprint.json');
		const craftItemList = Object.values(craftItem);
		const existItem = craftItemList.find((item) => item.name === itemName);
		if (existItem === undefined) return message.reply('Unknow BluePrint');
		return existItem;
	};
	client.createCraftedItem = async (member, name, strength, constitution, agility, spirit, intelligence, vitality, emplacement) => {
		await raphael
			.query(
				`insert into craftitem (USER_ID, ITEM_NAME, ATTAQUE, CONSTITUTION, AGILITY, ESPRIT, INTELLIGENCE, VITALITY, EMPLACEMENT, PRICE) 
values (${member.id}, '${name}', ${strength}, ${constitution}, ${agility}, ${spirit}, ${intelligence}, ${vitality}, '${emplacement}', 0)`
			)
			.then((rows, err) => {
				if (err) throw err;
				return rows;
			});
	};
	client.updateCraftItem = async (item, strength, constitution, agility, spirit, intelligence, vitality, level) => {
		await raphael
			.query(
				`update craftitem set ATTAQUE = ${item['ATTAQUE'] + strength}, CONSTITUTION = ${item['CONSTITUTION'] + constitution}, AGILITY = ${item['AGILITY'] + agility},
                     ESPRIT = ${item['ESPRIT'] + spirit}, INTELLIGENCE = ${item['INTELLIGENCE'] + intelligence}, VITALITY = ${item['VITALITY'] + vitality}, LEVEL = ${item['LEVEL'] + level}
                     where ITEM_NAME = '${item['ITEM_NAME']}'`
			)
			.then((rows, err) => {
				if (err) throw err;
				return rows;
			});
	};
	client.updateChanceEnchant = async (item, chance) => {
		await raphael.query(`update craftitem set CHANCE = ${item['CHANCE'] + chance} where ITEM_NAME = '${item['ITEM_NAME']}'`).then((rows, err) => {
			if (err) throw err;
			return rows;
		});
	};
	client.addStreamer = async (name, guildId) => {
		let streamer = await client.getStreamer(name);
		if (streamer) {
			if (JSON.parse(streamer['GUILD']).find((guildID) => guildID === guildId)) return;
			let guildIDList = JSON.parse(streamer['GUILD']);
			guildIDList.push(guildId);
			let guilds = JSON.stringify(guildIDList);
			await raphael.query(`update twitch set GUILD = '${guilds}' where NAME = '${name}'`).then((rows, err) => {
				if (err) throw err;
				return rows;
			});
		} else {
			await raphael.query(`insert into twitch (NAME, GUILD) values ('${name}', '["${guildId}"]')`).then((rows, err) => {
				if (err) throw err;
				return rows;
			});
		}
	};
	client.getStreamer = async (name) => {
		let data = await raphael.query(`select * from twitch where NAME = '${name}'`).then((rows, err) => {
			if (err) throw err;
			return rows;
		});
		if (data) return data[0];
	};
	client.getAllStreamerName = async () => {
		let streamerListDB = await raphael.query(`select name from twitch`).then((rows, err) => {
			if (err) throw err;
			return rows;
		});
		let streamerList = [];
		for (let i = 0; streamerListDB.length > i; i++) {
			streamerList.push(streamerListDB[i]['name']);
		}
		return streamerList;
	};

	client.removeStreamer = async (name, guildID) => {
		let streamer = await client.getStreamer(name);
		let Guilds = JSON.parse(streamer['GUILD']);
		if (Guilds.length > 1) {
			Guilds.splice(Guilds.indexOf(guildID), 1);
			let guilds = JSON.stringify(Guilds);
			await raphael.query(`update twitch set GUILD = '${guilds}' where NAME = '${name}'`).then((rows, err) => {
				if (err) throw err;
				return rows;
			});
		}
		await raphael.query(`delete from twitch where NAME = '${name}' and GUILD = '["${guildID}"]'`).then((rows, err) => {
			if (err) throw err;
			return rows;
		});
	};
	client.getHdv = async (member) => {
		let data = await raphael.query(`select ID,NAME, USER_ID, QUANTITY, PRICE from hdv where USER_ID != ${member.id} and ISVIEW = true`).then((rows, err) => {
			if (err) throw err;
			return rows;
		});
		if (data) return data;
	};
	client.getUserItemHDV = async (member, item) => {
		await raphael.query(`select * from hdv where USER_ID = ${member.id} and NAME = '${item}'`).then((rows, err) => {
			if (err) throw err;
			return rows;
		});
	};
	client.getItemHDV = async (item) => {};
	client.addHDV = async (member, item, price, quantity) => {
		await raphael.query(`insert into hdv (USER_ID, NAME, PRICE, QUANTITY, DATE) values (${member.id}, '${item}', ${price}, ${quantity} ,${Date.now()})`).then((rows, err) => {
			if (err) throw err;
			return rows;
		});
	};
	client.removeHDV = async (member, item) => {
		await raphael.query(`delete from hdv where USER_ID = ${member.id} and NAME = '${item}'`).then((rows, err) => {
			if (err) throw err;
			return rows;
		});
	};
	client.updateItemHDVTimeOut = async (member, itemName) => {
		let item = await client.getUserItemHDV(member, itemName);
		if (item) {
			await raphael.query(`update hdv set ISVIEW = true where NAME = '${itemName}' and USER_ID = ${member.id}`).then((rows, err) => {
				if (err) throw err;
				return rows;
			});
		}
	};
	client.getRecolt = async () => {
		let recoltable = await raphael.query(`select NAME from recoltable`).then((rows, err) => {
			if (err) throw err;
			return rows;
		});
		if (recoltable) return recoltable[Math.floor(Math.random() * (recoltable.length - 1))];
	};
	client.addRecolt = async (name, type) => {
		await raphael.query(`insert into recoltable (NAME, TYPE) values ('${name}', '${type}')`).then((rows, err) => {
			if (err) throw err;
			return rows;
		});
	};
	client.removeRecolt = async (name, type) => {
		await raphael.query(`delete * from recoltable where NAME = '${name}' and TYPE = '${type}'`).then((rows, err) => {
			if (err) throw err;
			return rows;
		});
	};
	client.getHordeMonster = async () => {
		let HordMonster = await raphael.query(`select * from monster order by rand() limit 1`).then((rows, err) => {
			if (err) throw err;
			return rows;
		});
		if (HordMonster) return HordMonster;
	};
};
