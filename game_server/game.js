function Game(options) {

   this.isStarted = false;
   this.winner = null;
   this.playingArea = [];
   this.sizePlayingArea = options.sizePlayingArea || 19;
   this.idUserX = options.idUserX;
   this.idUserO = options.idUserO;

   this.isReadyUserX = false;
   this.isReadyUserO = false;

   this.currentUser = options.idUserX;
   this.timeLastStep = null;
   this.countSteps = 0;
   this.lastStep = null;

   this.userStep = function(idCell, idUser) {
      var result = {
            isTrue: false,
            isWin: false,
            timeIsUp: false
         },
         sign = idUser === this.idUserX ? 'x' : 'o';

      // Проверяем, не прошло ли больше минуты
      if (Date.now() - this.timeLastStep > 61000) {
         result['timeIsUp'] = true;
         return result;
      }

      // Проверяем, чья очередь ходить
      if (this.currentUser !== idUser) {
         result['errorMessage'] = 'Ходит другой игрок!';
         return result;
      }

      // Если клетка уже занята, то ошибка
      if (this.playingArea[idCell]) {
         result['errorMessage'] = 'Клетка уже занята!';
         return result;
      }

      this.playingArea[idCell] = sign;
      this.countSteps++;
      this.lastStep = idCell;
      this.timeLastStep = Date.now();
      result['isTrue'] = true;
      result['sign'] = sign;
      if (this._checkStepOnWin(idCell, sign)) {
         result['isWin'] = true;
         this.winner = idUser;
         this.isStarted = false;
         return result;
      }
      this.currentUser = idUser === this.idUserX ? this.idUserO : this.idUserX;

      return result;
   };

   this._checkStepOnWin = function(idCell, sign) {
      var ids = idCell.split('x'),
         stepX = Number(ids[0]),
         stepY = Number(ids[1]),
         countSame = 0,
         i;

      // --
      countSame = 0;
      for (i = -4; i <= 4; i++) {
         countSame = this.playingArea[(stepX + i) + 'x' + stepY] === sign ? countSame + 1 : 0;
         if (countSame === 5) {
            break;
         }
      }
      if (countSame >= 5) {
         return true;
      }

      // |
      countSame = 0;
      for (i = -4; i <= 4; i++) {
         countSame = this.playingArea[stepX + 'x' + (stepY + i)] === sign ? countSame + 1 : 0;
         if (countSame === 5) {
            break;
         }
      }
      if (countSame >= 5) {
         return true;
      }

      // \
      countSame = 0;
      for (i = -4; i <= 4; i++) {
         countSame = this.playingArea[(stepX + i) + 'x' + (stepY + i)] === sign ? countSame + 1 : 0;
         if (countSame === 5) {
            break;
         }
      }
      if (countSame >= 5) {
         return true;
      }

      // \
      countSame = 0;
      for (i = -4; i <= 4; i++) {
         countSame = this.playingArea[(stepX - i) + 'x' + (stepY + i)] === sign ? countSame + 1 : 0;
         if (countSame === 5) {
            break;
         }
      }
      if (countSame >= 5) {
         return true;
      }

      return false;
   };

   this.checkStepOtherUser = function(idUser) {
      return {
         stepIsDone: this.currentUser === idUser || !this.isStarted,
         idCell: this.lastStep,
         otherUserIsWin: !!this.winner
      };
   };

   // Происходит каждую секунду, когда загружается страница game
   // Пока оба игрока не будут готовы
   this.onReadyUser = function(idUser) {
      if (idUser === this.idUserX) {
         this.isReadyUserX = true;
         if (this.isReadyUserO) {
            this.isStarted = true;
            this.timeLastStep = Date.now();
            return true;
         }
      }
      if (idUser === this.idUserO) {
         this.isReadyUserO = true;
         if (this.isReadyUserX) {
            this.isStarted = true;
            this.timeLastStep = Date.now();
            return true;
         }
      }
      return false;
   };

   // Говорят, что время истекло
   this.timeIsUp = function(idUser) {
      // Проверим, вдруг игра уже закончена или перепроверим время
      if (!this.isStarted || Date.now() - this.timeLastStep > 60000) {
         this.isStarted = false;
         return {
            isTrue: true,
            youWinner: idUser !== this.currentUser
         };
      }
      return {
         isTrue: false
      };
   };
}

module.exports = Game;
