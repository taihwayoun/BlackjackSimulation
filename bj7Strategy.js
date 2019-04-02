var Strategy = function (player, index, dealer){
    //if (index==null || index==undefined) index=0; //index points to an array of cards in an array of hands.
    //var cards = player.hand.newHand[index].cards;
    var cards = player.hand.objHands[index].cards;
    //console.log(cards);
    var handValue = function () {
        var sum = 0;
        var aces = 0;
        // a hard hand is one with no aces or where aces are forced to be equal to 1.
        // a soft hand is one with at least one ace which may still count as 11 or 1.
        var hard = true;
        var bj = false;
        var pair = false;
        var suitedPair = false;

        if (cards.length < 2){
            sum = cards[0].value();
            return {sum: sum};
        };

        for (var i = 0; i < cards.length; ++i) {
            var value = cards[i].value();
            if (value != 11) {
                sum += value;
            } else {
                ++aces;
            }
        }
        while (aces > 0) {
            if (sum+11 == 21 && index < 1) {  //only first two cards are a candidate for a blackjack.
                hard = false,
                sum += 11;
                bj = true;
            }
            else if (sum + 11 <= 21) {
                hard = false;
                sum += 11;
            } else {
                sum += 1;
            }
            --aces;
        }
        if (cards.length==2 && cards[0].value()==cards[1].value()){
            pair = true;
            //console.log(cards[0].suit+ " " + cards[1].suit);
            if (cards[0].suitValue()==cards[1].suitValue()) suitedPair=true;
        }
        var hardness = hard ? "hard" : pair? "pair" : "soft";
        return {
            hard: hard, 
            sum: sum, 
            bj: bj, 
            pair: pair,
            suitedPair: suitedPair,
            toString: function() { return bj? "blackjack": hardness + " " + sum;} };
    };

    var states = {
        B: 0,
        ST: 1,
        H: 2,
        D: 3,
        SP: 4,
        BJ: 5,
    };
    var state = function () {
        var dealerCard = dealer.hand.getFirstCard();

        // encoding of basic strategy

        //matrix for two cards
        var matrix = {
            hard: {
                8: [states.H, states.H, states.H, states.D, states.D, states.H, states.H, states.H, states.H, states.H],
                9: [states.D, states.D, states.D, states.D, states.D, states.H, states.H, states.H, states.H, states.H],
                10: [states.D, states.D, states.D, states.D, states.D, states.D, states.D, states.D, states.H, states.H],
                11: [states.D, states.D, states.D, states.D, states.D, states.D, states.D, states.D, states.D, states.D],
                12: [states.H, states.H, states.ST, states.ST, states.ST, states.H, states.H, states.H, states.H, states.H],
                13: [states.ST, states.ST, states.ST, states.ST, states.ST, states.H, states.H, states.H, states.H, states.H],
                14: [states.ST, states.ST, states.ST, states.ST, states.ST, states.H, states.H, states.H, states.H, states.H],
                15: [states.ST, states.ST, states.ST, states.ST, states.ST, states.H, states.H, states.H, states.H, states.H],
                16: [states.ST, states.ST, states.ST, states.ST, states.ST, states.H, states.H, states.H, states.H, states.H],
            },
            soft: {
                13: [states.H, states.H, states.H, states.D, states.D, states.H, states.H, states.H, states.H, states.H],
                14: [states.H, states.H, states.H, states.D, states.D, states.H, states.H, states.H, states.H, states.H],
                15: [states.H, states.H, states.D, states.D, states.D, states.H, states.H, states.H, states.H, states.H],
                16: [states.H, states.H, states.D, states.D, states.D, states.H, states.H, states.H, states.H, states.H],
                17: [states.H, states.D, states.D, states.D, states.D, states.H, states.H, states.H, states.H, states.H],
                18: [states.ST, states.D, states.D, states.D, states.D, states.ST, states.ST, states.H, states.H, states.ST],
                19: [states.ST, states.ST, states.ST, states.ST, states.D, states.ST, states.ST, states.ST, states.ST, states.ST],
            },
            pair: {
                12: [states.SP, states.SP, states.SP, states.SP, states.SP, states.SP, states.SP, states.SP, states.SP, states.SP],
                4: [states.SP, states.SP, states.SP, states.SP, states.SP, states.SP, states.H, states.H, states.H, states.H],
                6: [states.SP, states.SP, states.SP, states.SP, states.SP, states.SP, states.H, states.H, states.H, states.H],
                8: [states.H, states.H, states.H, states.SP, states.SP, states.H, states.H, states.H, states.H, states.H],
                10: [states.D, states.D, states.D, states.D, states.D, states.D, states.D, states.D, states.H, states.H],
                12: [states.SP, states.SP, states.SP, states.SP, states.SP, states.H, states.H, states.H, states.H, states.H],
                14: [states.SP, states.SP, states.SP, states.SP, states.SP, states.SP, states.SP, states.H, states.H, states.H],
                16: [states.SP, states.SP, states.SP, states.SP, states.SP, states.SP, states.SP, states.SP, states.SP, states.SP],
                18: [states.SP, states.SP, states.SP, states.SP, states.SP, states.ST, states.SP, states.SP, states.ST, states.ST],
            },
        };

        if (cards.length < 2) return states.H;

        var sum = handValue();
        if (sum.sum > 21) {
            return states.B;
        };

        if (sum.bj) {
            return states.BJ;
        };

        if (player.isDealer) {
            if (!sum.hard && sum.sum==17){  //dealer hits on soft 17
                return states.H;
            }
            else if (sum.sum >= 17 && sum.sum <= 21) {
                return states.ST;
            } else {
                return states.H;
            }
        };

        if (sum.sum >= 20) return states.ST;

        if (sum.pair==false && sum.hard && sum.sum >= 17) {
            return states.ST;
        };

        if (!sum.hard && sum.sum >= 19) {
            return states.ST;
        };

        if (sum.pair==false && sum.sum <= 7) {
            return states.H;
        };

        if (cards.length > 2 && sum.sum <= 11){
            return states.H;
        }

        var dealerIndex = dealerCard.value();

        dealerIndex -= 2;

        var returnVal;

        returnVal = sum.pair? matrix['pair'][sum.sum][dealerIndex]:matrix[sum.hard ? "hard" : "soft"][sum.sum][dealerIndex];

        if (returnVal == states.D){
            return cards.length>2? states.ST: states.D;
        }
        else if (returnVal == states.SP && index >3){
            var val = sum.sum;
            if (val >= 17) return states.ST;
            else if (val <=11) return states.H;
            else return matrix["hard"][val][dealerIndex];
        }
        else {
            return returnVal;
        };
    };

    var stateAsTxt = function () {
        var stateVal = state();
        for (var i = 0; i < Object.keys(states).length; ++i) {
            var val = states[i];
            if (val === stateVal) {
                return i;
            }
        }
        return "UNKNOWN";
    };

     return {
        cards: this.cards,
        //addCard: function (card) {
        //    cards.push(card);
        //},
        //removeCard: function(){
        //    return cards.pop();
        //},
        states: states,
        handValue: handValue,
        stateAsTxt: stateAsTxt,
        state: state,
        toString: function () {
            var out = "";
            for (var j = 0; j < cards.length; ++j) {
                if (j !== 0) {
                    out += ",";
                }
            }
            out += " [" + handValue() + "]";
            return out;
        },
    };
};

module.exports = {Strategy: Strategy};