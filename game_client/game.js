function Game(idGame, mySign) {

   this.idGame = idGame;
   this.isStarted = false; // Началась ли игра
   this.stepByMe = mySign === 'x'; // Первый ход за мной, если я X
   this.mySign = mySign; // Мой флаг (x или o)

   // Свойства таймера:
   this.timerIsWork = false;
   this.needRefreshTimer = false;

   this.startGame = function() {
      var self = this;
      this.waitReadyAllUsers(function(response) {
         self._setTextToStatus('Игра началась!' + (self.stepByMe ? '</br>Ваш ход' : '</br>Ждём ход второго игрока'));
         self.isStarted = true;
         self.timerIsWork = true;
         self.refreshAndStartTimer();
         if (!self.stepByMe) {
            self.needRefreshTimer = true;
            self.waitStepOtherUser();
         }
      });
   };

   // Ждёт, когда все игроки будут готовы начать игру
   this.waitReadyAllUsers = function(cb) {
      var self = this,
         timerId = setTimeout(function tick() {
            self.sendPostDataToServer({
               idGame: self.idGame,
               type: 'checkReady'
            }, function(response) {
               if (!response.ready) {
                  timerId = setTimeout(tick, 1000);
                  return;
               }

               cb(response);
            });
         }, 1000);
   };

   // Ждёт, когда другой игрок сделает ход
   this.waitStepOtherUser = function(cb) {
      var self = this,
         timerId = setTimeout(function tick() {
            self.sendPostDataToServer({
               idGame: self.idGame,
               type: 'checkStepOtherUser'
            }, function(response) {
               if (!response.stepIsDone) {
                  timerId = setTimeout(tick, 1000);
                  return;
               }

               self.needRefreshTimer = true;
               self._setTextToStatus('Ваш ход');
               self._setSignToArea(response.idCell, self.mySign === 'x' ? 'y' : 'x');
               self.stepByMe = true;
               if (response.otherUserIsWin) {
                  self.timerIsWork = false;
                  self.isStarted = false;
                  alert('Выиграл другой игрок =(');
               }
            });
         }, 1000);
   };

   // Отправить данные на сервер и получить ответ
   this.sendPostDataToServer = function(data, cb) {
      var xhr = ('onload' in new XMLHttpRequest()) ? new XMLHttpRequest() : new XDomainRequest();
      xhr.open('POST', '/game', true);
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      xhr.withCredentials = true;
      xhr.onreadystatechange = function(response) {
         if (xhr.readyState === XMLHttpRequest.DONE) {
            cb(JSON.parse(xhr.responseText));
         }
      };
      xhr.send(JSON.stringify(data));
   };

   // Клик по ячейке
   this.onClickToCell = function(eventObject) {
      var self = this;
      if (!this.isStarted) {
         return;
      }
      this.sendPostDataToServer({
         idGame: this.idGame,
         type: 'step',
         idCell: eventObject.id.substr(2)
      }, function(response) {

         // Если ход неверный, то отобразим ошибку
         if (!response.isTrue) {
            alert(response.errorMessage);
            return;
         }

         // Если вышло время, то ничего не делаем
         // По окончанию времени посылается запрос на подтверждение
         // и выводится результат
         if (response.timeIsUp) {
            return;
         }

         eventObject.classList.add(response.sign === 'x' ? 'cross' : 'radio');
         if (response.isWin) {
            self.timerIsWork = false;
            self.isStarted = false;
            alert('Вы выиграли!');
            return;
         }
         self.stepByMe = false;
         self._setTextToStatus('Ждём ход второго игрока');
         self.needRefreshTimer = true;
         self.waitStepOtherUser();
      });
   };

   // Обновить таймер
   this.refreshAndStartTimer = function() {
      var self = this,
         timerSpan = document.querySelector('#timer'),
         currentSec = 60;
      timerSpan.innerHTML = currentSec.toString();
      this.timerIsWork = true;
      var timer = setInterval(function() {
         if (self.needRefreshTimer) {
            currentSec = 60;
            self.needRefreshTimer = false;
         }
         if (currentSec > 0) {
            currentSec--;
            timerSpan.innerHTML = currentSec.toString();
         } else {
            currentSec++;
            self.sendPostDataToServer({
               idGame: self.idGame,
               type: 'timeIsUp'
            }, function(response) {
               if (response.isTrue) {
                  self.timerIsWork = false;
                  alert('Время вышло!' + (response.youWinner ? ' Вы выиграли!' : ' Вы проиграли =('));
               }
            });
         }

         if (!self.timerIsWork) {
            clearInterval(timer);
         }
      }, 1000);
   };

   // Установить флажок на поле
   this._setSignToArea = function(idCell, sign) {
      document.querySelector('#id' + idCell).classList.add(sign === 'x' ? 'cross' : 'radio');
   };

   // Установить новый статус игры
   this._setTextToStatus = function(text) {
      document.querySelector('#statusText').innerHTML = text;
   };
}


var game;

// После загрузки страницы создаём игру
document.addEventListener('DOMContentLoaded', function(event) {
   game = new Game(idGame, mySign);
   game.startGame();
});
