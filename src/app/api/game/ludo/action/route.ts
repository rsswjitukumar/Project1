import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export async function POST(request: Request) {
  try {
    const { matchId, action, tokenIndex } = await request.json(); // action: 'ROLL' | 'MOVE'
    
    // Auth
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'skillspin_default_secret_key_2026');
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    return await prisma.$transaction(async (tx) => {
      const match = await tx.match.findUnique({ where: { id: matchId } });
      if (!match || match.status !== 'PLAYING') return NextResponse.json({ error: 'Invalid match' }, { status: 400 });
      if (match.player1Id !== userId && match.player2Id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

      // @ts-ignore
      let state = JSON.parse(match.gameState || '{}');

      if (state.winnerId) return NextResponse.json({ error: 'Game already finished' }, { status: 400 });
      if (state.currentTurn !== userId) return NextResponse.json({ error: 'Not your turn' }, { status: 400 });

      const isPlayer1 = match.player1Id === userId;
      const opponentId = isPlayer1 ? match.player2Id : match.player1Id;

      if (action === 'ROLL') {
        if (state.diceValue !== null) return NextResponse.json({ error: 'Dice already rolled' }, { status: 400 });
        const roll = Math.floor(Math.random() * 6) + 1;
        state.diceValue = roll;
        state.message = `Rolled a ${roll}! Select a token to move.`;
      } 
      else if (action === 'MOVE') {
        if (state.diceValue === null) return NextResponse.json({ error: 'Roll dice first' }, { status: 400 });
        if (tokenIndex < 0 || tokenIndex > 3) return NextResponse.json({ error: 'Invalid token' }, { status: 400 });

        const roll = state.diceValue;
        
        // Move token and update score
        if (isPlayer1) {
          const currentPos = state.player1Tokens[tokenIndex];
          if (currentPos + roll <= 57) {
            state.player1Tokens[tokenIndex] += roll;
            state.player1Score += roll;
          }
        } else {
          const currentPos = state.player2Tokens[tokenIndex];
          if (currentPos + roll <= 57) {
            state.player2Tokens[tokenIndex] += roll;
            state.player2Score += roll;
          }
        }

        // Win Condition: First to 50 points
        const winScore = 50;
        let gameFinished = false;

        if (state.player1Score >= winScore) {
          state.winnerId = match.player1Id;
          state.message = 'Player 1 Wins!';
          gameFinished = true;
        } else if (state.player2Score >= winScore) {
          state.winnerId = match.player2Id;
          state.message = 'Player 2 Wins!';
          gameFinished = true;
        } else {
          // Switch turn if no one won yet. Except if they rolled a 6, they get another turn!
          if (roll === 6) {
             state.message = 'Rolled a 6! Roll again.';
          } else {
             state.currentTurn = opponentId;
             state.message = 'Opponent\'s turn to roll.';
          }
        }

        state.diceValue = null;

        // Save state
        const updatedMatch = await tx.match.update({
          where: { id: matchId },
          data: { 
            gameState: JSON.stringify(state),
            status: gameFinished ? 'FINISHED' : 'PLAYING'
          }
        });

        // Payout if finished
        if (gameFinished) {
           const winAmount = match.entryFee * 1.8;
           await tx.user.update({
             where: { id: state.winnerId },
             data: { 
               walletBalance: { increment: winAmount },
               totalWinnings: { increment: winAmount }
             }
           });
           await tx.transaction.create({
             data: {
               userId: state.winnerId,
               amount: winAmount,
               type: 'MATCH_WIN',
               status: 'SUCCESS',
               gateway: 'SYSTEM'
             }
           });
        }
        
        return NextResponse.json({ success: true, match: updatedMatch, gameState: state });
      }

      // Save roll state
      const updatedMatch = await tx.match.update({
        where: { id: matchId },
        data: { gameState: JSON.stringify(state) }
      });
      return NextResponse.json({ success: true, match: updatedMatch, gameState: state });
    });
  } catch (err) {
    console.error('GAME_ACTION_ERROR:', err);
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}
