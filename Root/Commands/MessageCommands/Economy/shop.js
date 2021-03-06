const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
module.exports = {
	name: 'shop',
	usage: 'shop show <item> || !shop buy <item>',
	description: 'Permet de voir ou achetez un item',
	exemple: 'shop show épée en bois || !shop buy épée en bois',
	run: async (client, message, args) => {
		const Player = await client.getUser(message.member);
		if (Player === undefined) return message.reply("Player Doesn't exist");
		const item = args.slice(1).join(' ');
		const ItemInfo = await client.getItem(item);
		if (ItemInfo) {
			if (args[0] === 'show') {
				const showEmbed = new MessageEmbed()
					.setTitle(`${ItemInfo['ITEM_NAME']}`)
					.setColor('RANDOM')
					.setDescription(`Price: ${ItemInfo['PRICE']}`)
					.addField(
						'stats:',
						`Attaque: \`${ItemInfo['ATTAQUE']}\` Constitution: \`${ItemInfo['CONSTITUTION']}\`
                        Esprit: \`${ItemInfo['ESPRIT']}\` Intelligence: \`${ItemInfo['INTELLIGENCE']}\`
                        Agility: \`${ItemInfo['AGILITY']}\` Vitality: \`${ItemInfo['VITALITY']}\`
                    `
					);
				return message.channel.send({ embeds: [showEmbed] });
			}
			if (args[0] === 'buy') {
				const shopEmbed = new MessageEmbed()
					.setTitle(`${ItemInfo['ITEM_NAME']}`)
					.setColor('RANDOM')
					.setDescription(`Price: ${ItemInfo['PRICE']}`)
					.addField(
						'stats:',
						`Attaque: \`${ItemInfo['ATTAQUE']}\` Constitution: \`${ItemInfo['CONSTITUTION']}\`
                        Esprit: \`${ItemInfo['ESPRIT']}\` Intelligence: \`${ItemInfo['INTELLIGENCE']}\`
                        Agility: \`${ItemInfo['AGILITY']}\` Vitality: \`${ItemInfo['VITALITY']}\`
                    `
					);
				const ChoiceButton = new MessageActionRow().addComponents(
					new MessageButton().setCustomId('shopY').setLabel('Yes').setStyle('SUCCESS'),
					new MessageButton().setCustomId('shopN').setLabel('No').setStyle('DANGER')
				);
				message.reply({
					content: `Confirmez-vous l'achat de \`${ItemInfo['ITEM_NAME'].toLowerCase()}\``,
					embeds: [shopEmbed],
					components: [ChoiceButton],
				});
			}
		}
	},
};
