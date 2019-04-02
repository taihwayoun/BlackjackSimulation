'use strict';
const {knuthShuffle} = require('knuth-shuffle');
const strat = require('./bj7Strategy.js');

//------------------------------------------------------------------
// Bank Requirement
//------------------------------------------------------------------

class RequiredBankRoll {

 set unit(unit){
   this._unit = unit;
 };

 get unit(){
   return this._unit;
 };

 set requiredBankroll (total){
     this._requiredBankroll = total;
 }
 get requiredBankroll() {
   return this._requiredBankroll;
 };

};


//-----------------------------------------------------------------------------
// Card constructor function.
//-----------------------------------------------------------------------------

var cardVal = { "2":2, "3":3, "4":4, "5":5, "6":6, "7":7, "8":8, "9":9, "10":10, "J":10, "Q":10, "K":10, "A":11, };

var Card = function (rank, suit) {

  this.rank = rank;
  this.suit = suit;
  this.value = function(){return cardVal[this.rank]};
  this.suitValue = function(){return this.suit;};
}

//-----------------------------------------------------------------------------
// Stack constructor function.
//-----------------------------------------------------------------------------

var Stack = function() {

  // Create an empty array of cards.
  this.hiLoValue =0;
  this.cards = [];
  this.eachCardArray  = new Array(10)//number of each card in the stack, order: 2,3,4,5,6,7,8,9,10,11
  this.muck=[];

  this.makeDeck           = stackMakeDeck;
  this.shuffle            = ()=>{knuthShuffle(this.cards);};
  this.count              = ()=> {return this.cards.length;};
  this.numberOfDecks      = 0;
  this.deal               = stackDeal;
  this.probabilities      = calcProbability;

}

//-----------------------------------------------------------------------------
// stackMakeDeck(n): Initializes a stack using 'n' packs of cards.
//-----------------------------------------------------------------------------

var stackMakeDeck = function(n) {
  if (n===null||n===undefined) n=2; //double deck is default
  this.numberOfDecks = n;
  var ranks = new Array("A", "2", "3", "4", "5", "6", "7", "8", "9",
                        "10", "J", "Q", "K");
  var suits = new Array("C", "D", "H", "S");
  var i, j, k;
  var m;

  m = ranks.length * suits.length;

  // Set array of cards.

  this.cards = new Array(n * m);

  // Fill the array with 'n' packs of cards.

  for (i = 0; i < n; i++)
    for (j = 0; j < suits.length; j++)
      for (k = 0; k < ranks.length; k++)
        {this.cards[i * m + j * ranks.length + k] = new Card(ranks[k], suits[j]);}
  
  // Initialize the number of each card in the stack
  for (i=0; i<this.eachCardArray.length; i++){
    i==8? this.eachCardArray[i] = 4*4*this.numberOfDecks: this.eachCardArray[i]=4*this.numberOfDecks;
  }
}

//-----------------------------------------------------------------------------
// stackDeal(): Removes the first card in the stack and returns it; 
//calculate hi-lo card counts and the probabilities of each card to come out
//-----------------------------------------------------------------------------

var stackDeal = function() {
  if (this.cards.length > 0){
    var card = this.cards.shift();
    var val = card.value();
    val <= 6? ++this.hiLoValue: val >=10? --this.hiLoValue: null; //Hi-Lo card count
    --this.eachCardArray[val-2];
    this.muck.push(card);
    return card;
  }
  else
    return null;
}

var calcProbability=function(){
  // 2 to 9: (4*numDecks divided by total card count * 100)
  let probs=[]
  for (var i=0; i<this.eachCardArray.length; ++i){
    var prob = 100 * this.eachCardArray[i]/this.count();
    probs.push(prob);
  }
  return probs;
}


//-----------------------------------------------------------------------------
// Hand and Player
//-----------------------------------------------------------------------------
var results = {
    WIN: 1,
    EVEN: 0,
    LOSE: -1
}

class Subhand {
  constructor(){
    this.cards = [];
    this.value = 0;
    this.doubled = false;
    this.bj=false;
    this.bet=0;
    this.win=results.EVEN;
  };
};

class Hand {
    constructor(){
        this.objHands= [];
        this.addCard=function(index,card){ this.objHands[index].cards.push(card);};
        this.count= function(){return this.objHands.length;};
        this.getFirstCard= function(){return this.objHands[0].cards[0];}; //to be used to get the dealer's up-card
      
    }
}

var Player = function(initBankroll, moneyToAddAtZero, lossAllowed){
  var rb = new RequiredBankRoll();
  rb.requiredBankroll=initBankroll;
  rb.unit = moneyToAddAtZero;
  return{
    totalBankroll: rb.requiredBankroll,
    hand: new Hand(),
    position: 0,  
    inactive: false, // used to indicate the number of active players. an inactive player sits out for x rounds
    inactiveRounds: 0,
    isDealer: false,
    //bet: 0,
    runningBankroll: rb.requiredBankroll,
    winRecords:[],
    lossAllowed: lossAllowed,
    splitHand, adjustBet, winScore, calcWin, calcBankroll, sitOut, requestShuffle,
    addMoney() {
      this.totalBankroll += rb.unit;
      this.runningBankroll += rb.unit;
    },
    emptyHand(){this.hand = new Hand();},

  };
};

var requestShuffle = function(){
  return true;
}

var sitOut=function(){
  this.inactive = true;
  this.totalBankroll = this.runningBankroll;
}

var splitHand = function(index){
    var splcard = this.hand.objHands[index].cards.pop();
    var splhand = new Subhand();
    splhand.bet = this.hand.objHands[0].bet;
    splhand.cards.push(splcard);
    this.hand.objHands.push(splhand);
  };

function calcWin(dealerHand){
    var dhv = dealerHand.objHands[0].value;
    var dbj = dealerHand.objHands[0].bj;
    if (this.hand.objHands.length < 2) var pbj = this.hand.objHands[0].bj;
    var phv;
    if (dbj && pbj) this.hand.objHands[0].win = results.EVEN;
    else if (dbj && !pbj) this.hand.objHands[0].win = results.LOSE;
    else if (!dbj && pbj) this.hand.objHands[0].win = results.WIN;
    else {
        for (var i=0; i< this.hand.objHands.length; ++i){
            phv = this.hand.objHands[i].value;
            if (phv > 21) this.hand.objHands[i].win = results.LOSE;
            else if (dhv > 21 || phv > dhv) this.hand.objHands[i].win=results.WIN;
            else if (dhv==phv) this.hand.objHands[i].win=results.EVEN;
            else this.hand.objHands[i].win=results.LOSE;
        };
    };

};


function calcBankroll(){
  var prevBankroll = this.runningBankroll;
  var h = this.hand.objHands;
    if (this.runningBankroll >0){
        if (h[0].bj && h[0].win==results.WIN) this.runningBankroll += h[0].bet * 1.5;
        else {
        for (var i=0; i < h.length;++i){
            if (h[i].doubled) {
                h[i].bet *=2 ;
            };
            this.runningBankroll += h[i].bet * h[i].win;
            }
        }
    }
    if (this.runningBankroll < 0) {
      this.addMoney();
      //console.log(this.runningBankroll);
    }
    if (this.winRecords.length >10) this.winRecords.shift();  //keep track of th 10 most recent wins or loses
    if (prevBankroll < this.runningBankroll) this.winRecords.push(1);
    else if (prevBankroll == this.runningBankroll) this.winRecords.push(0);
    else this.winRecords.push(-1);
    if (this.previousBankroll - this.lossAllowed < this.runningBankroll) sitOut(); //lose a certain amount, player sits out, i.e. active = false, for some rounds
}


function winScore(){
  var score=0;
  if (this.winRecords.length > 0){
    for (var i=0; i<this.winRecords.length; ++i){
      score += this.winRecords[i];
    };
  };
  return score;
};

//Adjust the amount of bet according to the hi-lo value
function adjustBet(hilo, baseBet, decks){
  var weight = decks >= 6? 2: 1;
  var weight = Math.floor(decks/2);
  if (this.runningBankroll>0){
    if (this.winScore()>=0){
      if (hilo >= 8*weight) this.hand.objHands[0].bet = 4*baseBet;
      else if (hilo >= 6*weight) this.hand.objHands[0].bet = 3*baseBet;
      else if (hilo >= 4*weight) this.hand.objHands[0].bet = 2*baseBet;
      //else if (hilo >=2) this.bet = 2*baseBet
    }
  } else this.bet = 0;
  //console.log(this.bet);
};

//---------------------------------------------------------------------------------
// Play Log 
//---------------------------------------------------------------------------------

class PlayLog {
  constructor (){
    this.time= new Date();
    this.deck= 0;
    this.round= 0;
    this.playerNumber=0;
    this.dealer= null;
    this.players= [];
    this.winnings = [];
    this.bankrolls=[];
    }; 
};

class PlayLog2 {
  constructor (){
    this.time= new Date();
    this.deck= 0;
    this.round= 0;
    this.playerNumber=0;
    this.players= [];
    }; 
};

let PlayerLog={
  totalBankroll:0,
  hand: new Hand(),
  dealerHand: new Hand(),
  postion: 0,
  inactive: false,
  runningBankroll:0,
  result: results.EVEN,
}

//----------------------------------------------------------------------------------
// Pair stat: to produce statistics on pairs and suited pairs
//----------------------------------------------------------------------------------

class PairStat{
  constructor(){
    this.pairCount=0;
    this.rounds=[];
    this.suited=0;
    this.suitedRounds=[];
  };
  pairTest(r){
    var finder=this.rounds.find(function(value){
      return value==r;
    });
    if (finder==undefined){ //to prevent the same rounds from being recorded more than twice
      ++this.pairCount;
      this.rounds.push(r);
    };
  };
  suitedPairTest(r){
    var finder=this.suitedRounds.find(function(value){
      return value==r;
    });
    if (finder==undefined){
      ++this.suited;
      this.suitedRounds.push(r);
    };
  };
};

//==================================================================================
// Class Game: Game processes
//==================================================================================

var Game = function(options){

  var defaultOptions = { //default game options
    minBet: 25,
    bankroll: 3000,
    moneyToAddAtZero: 500,
    //maxSplits: 3, //splitting 3 times produces four hands
    canSurrender: false,
    cutRate: 0.4,
    numPlayers: 3,
    numDecks: 2,
    rounds: 100,
  };

  if (options==undefined || options==null) options = defaultOptions;
  //if (arguments.length ==0) options = defaultOptions;

//----------------------------------------------------------------------------------
// Game: initial setup
//----------------------------------------------------------------------------------
  var players=[];
  var dealer;
  for (var i=0; i < options.numPlayers; ++i) {
    var player = new Player(options.bankroll, options.moneyToAddAtZero, options.lossAllowed);
    player.position=i+1;
    if (player.position==options.numPlayers) {
      player.isDealer=true;
      dealer=player;
    }
    players.push(player);
  }

  for (let p of players){
    p.initBankroll = options.bankroll;
    p.runningBankroll = options.bankroll;
    p.active = true;
  };
  
//----------------------------------------------------------------------------------
// Game: one or more game rounds
//----------------------------------------------------------------------------------
  var stack = reshuffle(options.numDecks);  //first shuffle
  var roundLog = new PlayLog();  // logging a round
  roundLog.decks = options.numDecks;

  var cutPos = Math.floor(options.cutRate * stack.count());
  //var pairs = new PairStat(); Uncomment this to get pair statistics

  for (var round=0; round<options.rounds; ++round){  
  
    var shuffleRequested = false;  //When the win rate is below -3 (meaning losing about 7 rounds out of 10), a shuffle is requested (or skip playing)
    var activePlayerCount = players.filter((p)=> p.inactive==false).length;

    //reshuffle, shuffle request, sit out------------------- 
    for (let p of players){
      if(p.winScore() <-4 ||p.runningBankroll < p.totalBankroll-p.lossAllowed) {
        p.sitOut();
        //console.log("Postion " + p.position + " sits out");
      }
      else if (p.winScore() <= -3) shuffleRequested = p.requestShuffle();
    };

    if (shuffleRequested){
      for (let p of players){
        p.winRecords = [];
        p.inactive = false;
      };
      stack = reshuffle(options.numDecks);
    }
    else if (stack.count()<cutPos){
      stack = reshuffle(options.numDecks);
    }
    //------------------------------------------------------
    roundLog.playerNumber = activePlayerCount;

    roundLog.round = round + 1;
    //console.log("Round " + (roundLog.round) + "--------");

    //bet is placed; bet may increase or stay minimum depending on card cout;
    var cardCount = stack.hiLoValue;
    for (let p of players){
      p.emptyHand();
      p.hand.objHands.push(new Subhand());
      if (!p.isDealer && !p.inactive) {
        p.hand.objHands[0].bet = options.minBet;
        p.adjustBet(cardCount, options.minBet, options.numDecks);
      };
    };


    //first two cards are dealt
    for (var k=0; k<2; ++k) 
      for (let p of players)
        if(!p.inactive)
          p.hand.addCard(0,stack.deal());

    var dealerStrategy = new strat.Strategy(dealer,0,dealer);
    if (dealerStrategy.handValue().bj) {
      dealer.hand.objHands[0].bj=true;
    };
    roundLog.dealer = dealer; //log the dealer

    //after the first two, use a strategy to take a card, split the hand, double down and so forth
    var strategy;
    var state;
    var takeCardByStrategy = function(player, splitcount){
      if (!player.inactive && !dealer.hand.objHands[0].bj){
          for (var j=0; j<= splitcount; ++j){
            strategy = new strat.Strategy(player, j, dealer);
            state = strategy.state();
            switch (state){
              case strategy.states.SP:
                //Uncomment this to get the statistics of pairs
                //if(splitcount==0) {
                //  pairs.pairTest(roundLog.round);
                //  if(strategy.handValue().suitedPair) pairs.suitedPairTest(roundLog.round);
                //};
                player.splitHand(j);
                ++splitcount;
                //console.log("Split: Player " + player.position+ " "+ splitcount + " time(s)");
                takeCardByStrategy(player, splitcount);
                break;
              case strategy.states.H:
                player.hand.addCard(j, stack.deal());
                takeCardByStrategy(player,splitcount);
                break;
              case strategy.states.D:
                player.hand.addCard(j, stack.deal());
                player.hand.objHands[j].doubled=true;
                //console.log('Double: Player '+ player.position + " Hand " +(j+1));
                break;
              case strategy.states.BJ:
                //console.log("Player " + player.position + " has a blackjack!");
                if (j==0) player.hand.objHands[0].bj=true;
              default:
                break;
                };
            };
        } else {
          strategy = new strat.Strategy(player, 0, dealer);
          if (strategy.state()==strategy.states.BJ) player.hand.objHands[0].bj=true;
        };
    };
    
    for (let p of players){
      takeCardByStrategy(p, 0);
    };

    for (let p of players){
      if (!p.inactive){
        for(let [index, elem] of p.hand.objHands.entries()){
            strategy = new strat.Strategy(p, index, dealer);
            elem.value =strategy.handValue().sum;
          };
        };
    };
    
    for (let p of players){
      if (!p.inactive){
        for(let [index, elem] of p.hand.objHands.entries()){
          strategy = new strat.Strategy(p, index, dealer);
          elem.value =strategy.handValue().sum;
          p.calcWin(dealer.hand);
          };
        };
      if (!p.isDealer) p.calcBankroll();
    };
    roundLog.players = players;

    var rec = [];
    var recbr =[];
    for (var i=0; i<activePlayerCount; ++i){
      if (!players[i].isDealer) {
        rec.push(roundLog.players[i].runningBankroll);
        recbr.push(roundLog.players[i].totalBankroll);
      };
    };
    roundLog.winnings.push(rec);
    roundLog.bankrolls.push(recbr);
  if (options.printScreen){
  
    console.log("\r\nRound " + round+": -------------------------------");
    var card;
    var string;
    for (let p of players){
        string="";
      for(let h of p.hand.objHands){
        (p.isDealer)? string="Dealer: ": string="Player "+ p.position+ ": ";
        for (let c of h.cards){
          string+="("+c.rank + c.suit +  ") ";
        };
        string += ": "+h.value + ": ";
        if (!p.isDealer) {
          if (h.doubled) string += "double : ";
          string += p.runningBankroll + ": "; 
          string += h.bet + ": ";
          string += p.winScore();
        }
        console.log(string);
        };
      };
      console.log("Hi-Lo Count: "+stack.hiLoValue);
      console.log("Running bankroll: " + rec);
      console.log("Total Bankroll: " + recbr);
    }; 
  };
   
  //uncomment the following to print pair statistics on the console
  //console.log("Number of pairs: " + pairs.pairCount + " out of " + round);
  //console.log("At rounds: " + pairs.rounds);  
  //console.log("Numer of suited pairs: " + pairs.suited);
  //console.log("At rounds: " + pairs.suitedRounds);

  return {
    roundLog,
    };

};

function reshuffle(decks){
  var stack = new Stack();
  stack.makeDeck(decks);
  stack.shuffle();  
  return stack;
}



//initGame();

module.exports = {
  Game,
  Stack
};
