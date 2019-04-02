var bj=require('./bj7.js');
var strat = require('./bj7Strategy.js')
var fs = require('fs');

var f="./bjdata.csv";
var gf="bjdata.json";

var options = { //default game options
  minBet: 50,
  bankroll: 2000,
  moneyToAddAtZero: 500,
  lossAllowed: 250,
  maxSplits: 4,
  canSurrender: false,
  cutRate: 0.4,
  numPlayers: 4, //including the dealer
  numDecks: 2,
  rounds: 100,
  shuffles: 0,
  finalOnly: 0,
  printFile: false,
  printGraphic: false,
  printScreen: true
};

var game = new bj.Game(options);

forPrintFinalOnConsole()
forWebGraphic();
forCsvFile();

function forPrintFinalOnConsole(){
  var i=0;
  var o=options;
  var finalwinnings=[];
  var totalbankrolls=[];

  if (o.finalOnly>0){
    o.printScreen = false,o.printFile=false, o.printGraphic=false; 
    var over=0,half=0,total=0;
      for (var i=1; i<=o.finalOnly;++i){
        var g=game.roundLog;
        finalwinnings=[...finalwinnings,...g.winnings[g.winnings.length -1]];
        totalbankrolls=[...totalbankrolls,...g.bankrolls[g.bankrolls.length -1]];
        //totalbankrolls=totalbankrolls.concat(g.bankrolls[g.bankrolls.length -1]);
        console.log (i + ". \tTotal bankroll: "+ g.bankrolls[g.winnings.length-1]);
        console.log ("\tFinal Bankroll: " + g.winnings[g.winnings.length-1]);
        game = new bj.Game(o);
      }
      
      console.log("\r\nSummary->")
      console.log("All players start out with $" , o.bankroll.toFixed(2))
      console.log("Number of decks:" , o.numDecks);
      console.log("Number of players:" , o.numPlayers);
      console.log("Minimum bet: $" + o.minBet.toFixed(2));
      if (o.finalOnly>0) {
        var rf = o.finalOnly * o.numPlayers ;
        var over = (finalwinnings.filter(val=>val > o.bankroll)).length;
        var threeQuarters = (finalwinnings.filter(val=>val > o.bankroll*0.75)).length;
        var range = getFinalBankrollRange(finalwinnings);
        var maxTotal = getMaxBankroll(totalbankrolls)
        console.log(`Number of rounds (broken by ${o.rounds}):  ${o.rounds*o.finalOnly}`);
        console.log(`Total number of sessions: ${rf}, Wins: ${over},  over 75%: ${threeQuarters}`);
        console.log(`Max required bankroll: $${maxTotal.toFixed(2)}`);
        console.log(`Final winning range: $${range.min.toFixed(2)}~$${range.max.toFixed(2)}`);
        console.log(`Average winning: $${((finalwinnings.reduce((t,v)=>t+v, 0)/finalwinnings.length)-o.bankroll).toFixed(2)}`);
        console.log(`Percentage of wins:  ${(100*over/rf).toFixed(2)}%`);
        console.log(`Percentage of more than 75%: ${(100*threeQuarters/rf).toFixed(2)}%`);
      }
    }
    
 }

function getMaxBankroll(brolls){
  var tmp=[];
  //for (var i=0; i<this.bankrolls.length; ++i){
  //  tmp.push(this.bankrolls[i]);
  //}
  for (let x of brolls) tmp=tmp.concat(x);
  return tmp.reduce((a,b)=>{return Math.max(a,b)})
}

function getFinalBankrollRange(finals){
  var tmp=[];
  for (let x of finals) tmp=tmp.concat(x);
  var mx=tmp.reduce((a,b)=>{return Math.max(a,b)});
  var mn=tmp.reduce((a,b)=>{return Math.min(a,b)});
  return {max: mx, min:mn};
}


function forWebGraphic() {
  let i=0, p=0, g=game.roundLog, o=options;
  if (o.printGraphic){
    var lines="[['Round'],[";
      for (;p<g.players;++p) {
        p==g.players-1? lines +="'Player"+p+"'],":lines +="'Player"+p+"',";
      };
    
      var len = g.winnings.length;
      var n=g.winnings[0].length;
      for (; i <len; ++i) {
        lines += "[" + i + ","+ g.winnings[i] + "],";
      }
      lines += "]";
      fs.writeFile(gf, lines, function(err){
        if (err)throw err;
      });
};
} ;

function forCsvFile(){
  var g=game.roundLog, o=options;
  o.finalyOnly=0, o.printGraphic=false;
  if (o.printFile) {
      var lines="";
      for (let i=0; i < o.numPlayers-1;++i) {
        var p=g.players[i];
        i==o.playerNumbers-1? lines +="Player"+p.position+"\n":lines +="Player"+p.position+",";
      };
      lines += "\n";
      for (let w of g.winnings) {
        lines += w+ "\n";
      }
      fs.writeFile(f, lines, function(err){
        if (err)throw err;
      });
  }
};

