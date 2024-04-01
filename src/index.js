import dotenv from "dotenv";
import {
  Client,
  Routes,
  ActionRowBuilder,
  EmbedBuilder,
  SelectMenuBuilder,
  GatewayIntentBits,
} from "discord.js";
import { REST } from "@discordjs/rest";

import RolesCommand from "./commands/roles.js";

dotenv.config();

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const ROLES_CHANNEL_ID = "1223339217799872653";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const rest = new REST({ version: "10" }).setToken(TOKEN);

client.on("ready", () => console.log(`${client.user.tag} has logged in!`));

client.on("messageCreate", async (message) => {
  if (message.content === "!setupRoleMenu") {
    // Vérifiez si l'utilisateur a la permission d'exécuter cette commande
    if (!message.member.permissions.has("ADMINISTRATOR")) {
      message.reply(
        "Vous n'avez pas la permission de configurer le menu des rôles."
      );
      return;
    }

    const channel = await client.channels.fetch(ROLES_CHANNEL_ID);

    // Créez l'intégration avec la description et l'image
    const roleEmbed = new EmbedBuilder()
      .setColor(0x1f8b4c)
      .setTitle("Rôles de spécialité")
      .setDescription(
        "Votre équipage aura toujours besoin de connaître vos talents, réclamez votre rôle ci-dessous."
      )
      .setImage(
        "https://images-ext-1.discordapp.net/external/tjRDahmklOJxNdh0QXIg8vajqH6BfI4wOQKwUfPIuds/https/i.ibb.co/Rj8Jwrm/Role-Distinctions.png?format=webp&quality=lossless&width=1020&height=411"
      ); // Remplacez par l'URL de votre image

    // Créez le menu de sélection de rôles
    const roleMenu = new ActionRowBuilder().addComponents(
      new SelectMenuBuilder()
        .setCustomId("select-role")
        .setPlaceholder("Faites une sélection")
        .addOptions([
          {
            label: "🛞Barreur",
            value: "1224142023448072322", // L'ID de votre rôle
          },
          {
            label: "⚔️MC",
            value: "1224142114267598919",
          },
          {
            label: "🪚Répa",
            value: "1224142186569007154",
          },
          {
            label: "🪜Flex",
            value: "1224142310338596964",
          },
          // Répétez pour les autres rôles...
        ])
    );

    // Envoyez le message avec l'intégration et le menu de sélection
    await channel.send({
      embeds: [roleEmbed],
      components: [roleMenu],
    });
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isSelectMenu()) return;

  if (interaction.customId === "select-role") {
    const selectedRoleValue = interaction.values[0]; // L'ID du rôle sélectionné
    const role = interaction.guild.roles.cache.get(selectedRoleValue);
    if (!role) {
      await interaction.reply({
        content: "Le rôle sélectionné n'existe pas.",
        ephemeral: true,
      });
      return;
    }

    try {
      // Assurez-vous que l'utilisateur ne peut avoir qu'un seul des rôles à la fois
      const roles = [
        "1224142023448072322",
        "1224142114267598919",
        "1224142186569007154",
        "1224142310338596964",
      ]; // Les IDs de tous les rôles sélectionnables
      const rolesToRemove = interaction.member.roles.cache.filter(
        (role) => roles.includes(role.id) && role.id !== selectedRoleValue
      );
      await interaction.member.roles.remove(rolesToRemove);
      await interaction.member.roles.add(role);
      await interaction.reply({
        content: `Le rôle ${role.name} vous a été attribué avec succès!`,
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "Une erreur est survenue lors de l'attribution du rôle.",
        ephemeral: true,
      });
    }
  }
});

async function main() {
  const commands = [RolesCommand];
  try {
    console.log("Started refreshing application (/) commands.");
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands,
    });
    client.login(TOKEN);
  } catch (err) {
    console.log(err);
  }
}

main();
