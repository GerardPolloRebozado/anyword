import { NextRequest, NextResponse } from "next/server";
import { games, broadcastToGame } from "@/lib/game-store";
import ollama from "ollama";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { code, userId, newRound = false } = body;

        if (!code || !userId) {
            return NextResponse.json(
                { error: "Game code and user ID are required" },
                { status: 400 }
            );
        }

        const game = games.get(code);
        if (!game) {
            return NextResponse.json(
                { error: "Game not found" },
                { status: 404 }
            );
        }

        const player = game.players.get(userId);
        if (!player) {
            return NextResponse.json(
                { error: "Player not in game" },
                { status: 403 }
            );
        }

        if (newRound && game.state === "playing") {
            console.log(
                `Game ${code}: Starting new round, resetting impostor from ${game.impostor}`
            );
            game.state = "waiting";
            game.word = undefined;
            game.impostor = undefined;
            game.players.forEach((p) => {
                p.isReady = false;
            });
            player.isReady = true;
            game.lastActivity = new Date();

            const players = Array.from(game.players.values()).map((p) => ({
                id: p.id,
                name: p.name || "Anonymous",
                isReady: p.isReady,
            }));

            broadcastToGame(code, {
                type: "player_joined",
                gameCode: code,
                data: {
                    players,
                    readyCount: 1,
                    totalPlayers: players.length,
                    canStart: false,
                    gameState: "waiting",
                },
                timestamp: new Date().toISOString(),
            });

            return NextResponse.json({
                success: true,
                isReady: true,
                gameState: {
                    code,
                    players,
                    gameState: "waiting",
                    readyCount: 1,
                    totalPlayers: players.length,
                    canStart: false,
                },
            });
        }

        if (game.state === "starting") {
            return NextResponse.json(
                { error: "Game is starting, please wait" },
                { status: 400 }
            );
        }

        if (game.state !== "waiting") {
            return NextResponse.json(
                { error: "Game has already started" },
                { status: 400 }
            );
        }

        player.isReady = !player.isReady;
        game.lastActivity = new Date();

        const players = Array.from(game.players.values()).map((p) => ({
            id: p.id,
            name: p.name || "Anonymous",
            isReady: p.isReady,
        }));

        const readyCount = players.filter((p) => p.isReady).length;
        const canStart = players.length >= 3 && players.every((p) => p.isReady);

        broadcastToGame(code, {
            type: "player_joined",
            gameCode: code,
            data: {
                players,
                readyCount,
                totalPlayers: players.length,
                canStart,
                gameState: game.state,
            },
            timestamp: new Date().toISOString(),
        });

        if (canStart) {
            game.state = "starting";

            broadcastToGame(code, {
                type: "game_started",
                gameCode: code,
                data: {
                    gameState: "starting",
                    players,
                },
                timestamp: new Date().toISOString(),
            });

            setTimeout(async () => {
                const currentGame = games.get(code);
                if (!currentGame || currentGame.state !== "starting") {
                    return;
                }

                try {
                    const raeWordRes = await fetch(
                        "https://rae-api.com/api/random"
                    );
                    let raeWord = await raeWordRes.json();
                    if (raeWord.data.word) {
                        raeWord = raeWord.data.word;
                    } else {
                        throw new Error("Error cogiendo palabra de la rae");
                    }
                    console.log(raeWord);

                    const res = await ollama.generate({
                        model: "gemma3:4b",
                        prompt: `
Eres un generador de palabras simples y cotidianas para un juego de mesa.
Tu tarea es devolver **una sola palabra diferente cada vez**, muy común y fácil de entender.
No uses tecnicismos ni palabras extrañas.
Si la palabra sugerida de la RAE es rara, cámbiala por un sinónimo cotidiano.
Responde solo con la palabra, en minúsculas, sin comillas ni explicaciones.
Palabra sugerida: ${raeWord}.
    `,
                        options: { temperature: 1.0, top_p: 0.85 },
                    });

                    currentGame.word = res.response.trim().toLowerCase();
                    const playerIds = Array.from(currentGame.players.keys());

                    for (let i = playerIds.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [playerIds[i], playerIds[j]] = [
                            playerIds[j],
                            playerIds[i],
                        ];
                    }

                    currentGame.impostor = playerIds[0];
                    currentGame.state = "playing";

                    console.log(
                        `Game ${code}: Selected impostor ${
                            currentGame.impostor
                        } from players [${playerIds.join(", ")}]`
                    );

                    broadcastToGame(code, {
                        type: "word_revealed",
                        gameCode: code,
                        data: {
                            gameState: "playing",
                        },
                        timestamp: new Date().toISOString(),
                    });
                } catch (error) {
                    console.error(
                        "Error generating word or setting game state:",
                        error
                    );
                    if (currentGame) {
                        currentGame.state = "waiting";
                    }
                }
            }, 3000);
        }

        return NextResponse.json({
            success: true,
            isReady: player.isReady,
            gameState: {
                code,
                players,
                gameState: game.state,
                readyCount,
                totalPlayers: players.length,
                canStart,
            },
        });
    } catch (error) {
        console.error("Set ready error:", error);
        return NextResponse.json(
            { error: "Failed to update ready state" },
            { status: 500 }
        );
    }
}
