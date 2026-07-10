package com.mjolnix.archstudio.settings;

import java.util.Map;

/** Registry of supported AI providers: default model, default base URL, endpoint style. */
public final class Providers {
    private Providers() {}

    public static final String STYLE_OPENAI = "openai";       // OpenAI Chat Completions compatible
    public static final String STYLE_ANTHROPIC = "anthropic"; // Anthropic Messages
    public static final String STYLE_GOOGLE = "google";       // Gemini generateContent

    public record Def(String defaultModel, String baseUrl, String style) {}

    public static final Map<String, Def> ALL = Map.of(
        "openai",     new Def("gpt-4o-mini",                 "https://api.openai.com/v1",                      STYLE_OPENAI),
        "anthropic",  new Def("claude-3-5-sonnet-latest",    "https://api.anthropic.com/v1",                   STYLE_ANTHROPIC),
        "google",     new Def("gemini-1.5-flash",            "https://generativelanguage.googleapis.com/v1beta", STYLE_GOOGLE),
        "groq",       new Def("llama-3.3-70b-versatile",     "https://api.groq.com/openai/v1",                 STYLE_OPENAI),
        "mistral",    new Def("mistral-large-latest",        "https://api.mistral.ai/v1",                      STYLE_OPENAI),
        "deepseek",   new Def("deepseek-chat",               "https://api.deepseek.com/v1",                    STYLE_OPENAI),
        "openrouter", new Def("openai/gpt-4o-mini",          "https://openrouter.ai/api/v1",                   STYLE_OPENAI),
        "custom",     new Def("",                            "",                                               STYLE_OPENAI)
    );

    public static boolean isValid(String provider) {
        return provider != null && ALL.containsKey(provider);
    }

    public static Def def(String provider) {
        return ALL.getOrDefault(provider, ALL.get("openai"));
    }
}
