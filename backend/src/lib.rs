use hf_plugin_api::{
    HaloForgePlugin, IpcRegistrar, LogLevel, PluginContext, PluginError, PluginMetadata,
    PLUGIN_ABI_VERSION,
};

mod commands;

pub struct AIReplayPlugin;

impl AIReplayPlugin {
    pub fn new() -> Self {
        Self
    }
}

impl Default for AIReplayPlugin {
    fn default() -> Self {
        Self::new()
    }
}

impl HaloForgePlugin for AIReplayPlugin {
    fn metadata(&self) -> PluginMetadata {
        PluginMetadata {
            id: "dev.haloforge.aireplay".into(),
            name: "AI Replay".into(),
            version: "0.1.0".into(),
            description: "Replay and narrate AI-assisted coding sessions.".into(),
            author: "HaloForge Team".into(),
            abi_version: PLUGIN_ABI_VERSION,
        }
    }

    fn on_load(
        &mut self,
        ctx: &dyn PluginContext,
        ipc: &mut dyn IpcRegistrar,
    ) -> Result<(), PluginError> {
        ctx.db().create_table(
            "recents",
            r#"
            id         TEXT PRIMARY KEY,
            path       TEXT NOT NULL UNIQUE,
            title      TEXT NOT NULL,
            opened_at  TEXT NOT NULL
            "#,
        )?;

        ipc.register("aireplay_list_recents", Box::new(commands::aireplay_list_recents))?;
        ipc.register("aireplay_load_story", Box::new(commands::aireplay_load_story))?;
        ipc.register("aireplay_save_story", Box::new(commands::aireplay_save_story))?;
        ipc.register("aireplay_remove_recent", Box::new(commands::aireplay_remove_recent))?;

        ctx.log(LogLevel::Info, "AI Replay plugin loaded");
        Ok(())
    }

    fn on_unload(&mut self) -> Result<(), PluginError> {
        Ok(())
    }
}
