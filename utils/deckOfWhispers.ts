import { DECK_OF_WHISPERS_CARDS } from '../constants';
import type { Card, YlemModifier, Rarity, RitualGenerator } from '../types';

function shuffle(array: Card[]): Card[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function* runRitualSimulation(): RitualGenerator {
  let deck = shuffle([...DECK_OF_WHISPERS_CARDS]);
  yield { type: 'START', deckSize: deck.length };

  let drawnCards: Card[] = [];
  let fluonsDrawn = 0;
  let ascendantCount = 0;
  let activeModifier: YlemModifier = null;
  let isReshuffled = false;
  let inDecisionPhase = false;

  while (deck.length > 0) {
    const card = deck.pop()!;
    drawnCards.push(card);
    ascendantCount = (card.type === 'Ascendant') ? ascendantCount + 1 : 0;
    
    yield { type: 'DRAW', card, remaining: deck.length };

    // --- Decision Phase Logic ---
    if (inDecisionPhase) {
      if (card.type === 'Ascendant') {
         // Check for Mythic upgrade
        const lastCardIsRevelation = deck.length === 1 && deck[0].type === 'Revelation';
        if (lastCardIsRevelation) {
          yield { type: 'LOG', message: "The Unseen Law is invoked! The cosmos aligns!" };
          return { rarity: 'Mythic', finalCard: card };
        }
        return { rarity: 'Legendary', finalCard: card };
      }
      if (card.type === 'Revelation') {
        yield { type: 'LOG', message: "Zya's Echo creates a feedback loop! Drawing again..." };
        // The loop continues, another card will be drawn
        continue;
      }
      if (card.type === 'Ashard') {
        return { rarity: 'Rare', finalCard: card };
      }
      if (card.type === 'Fluon') {
        if (activeModifier === 'Harmonized') {
            yield { type: 'LOG', message: "Harmonized Ylem dampens the power surge." };
            return { rarity: 'Uncommon', finalCard: card };
        }
        return { rarity: 'Epic', finalCard: card };
      }
    }

    // --- Standard Draw Logic ---
    switch (card.type) {
      case 'Ashard':
        if (activeModifier === 'Unstable') {
            yield { type: 'LOG', message: "Unstable Ylem reacts to the raw essence! The ritual continues..." };
            const nextCard = deck.pop()!;
            drawnCards.push(nextCard);
            yield { type: 'DRAW', card: nextCard, remaining: deck.length };
            if (['Ascendant', 'Revelation', 'Fluon'].includes(nextCard.type)) {
                return { rarity: 'Rare+', finalCard: nextCard };
            }
            return { rarity: 'Common', finalCard: nextCard };
        }
        return { rarity: 'Common', finalCard: card };

      case 'Revelation':
        if (drawnCards.length === 1 && !isReshuffled) {
          return { rarity: 'Common', finalCard: card };
        }
        if (isReshuffled) {
            if (activeModifier === 'Corrupted' && drawnCards.filter(c => c.type === 'Fluon').length === 1) {
                yield { type: 'LOG', message: "Corrupted Ylem supercharges Zya's Echo!" };
                return { rarity: 'Epic', finalCard: card };
            }
            return { rarity: 'Rare', finalCard: card };
        }
        break; // Should not be reachable in normal flow, but good practice

      case 'Fluon':
        fluonsDrawn++;
        if (fluonsDrawn === 1) {
          activeModifier = card.modifier || null;
          isReshuffled = true;
          deck = shuffle(deck);
          yield { type: 'MODIFIER', modifier: activeModifier, card: card };
          yield { type: 'RESHUFFLE', deckSize: deck.length };
        } else { // Second Fluon drawn
          return { rarity: 'Uncommon', finalCard: card };
        }
        break;

      case 'Ascendant':
        if (ascendantCount === 3) {
           const lastCardIsRevelation = deck.length === 1 && deck[0].type === 'Revelation';
           if (lastCardIsRevelation) {
              yield { type: 'LOG', message: "The Unseen Law is invoked! The cosmos aligns!" };
              return { rarity: 'Mythic', finalCard: card };
           }
           return { rarity: 'Legendary', finalCard: card };
        }
        if (ascendantCount === 2) {
          inDecisionPhase = true;
          yield { type: 'DECISION_PHASE' };
        }
        break;
    }
  }
  
  // Failsafe return if loop finishes unexpectedly
  return { rarity: 'Common', finalCard: drawnCards[drawnCards.length - 1] };
}