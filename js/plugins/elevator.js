/*:
 * @plugindesc 電梯控制
 * @author 炎月+Gemini
 * @技術指導 汐雲
 * @target MZ
 * @version 1.5
 *
 * @param elevatorname
 * @text 電梯名稱
 * @desc 輸入電梯編號，名稱訂好要更改程式
 * @type string
 *
 */

window.elevatormove = function(elevatorName) {
    if (elevatorName === 'A') {
        if ($gameVariables.value(21) === $gameVariables.value(26)) {
            $gameSwitches.setValue(25,false)
            $gameSwitches.setValue(26,false)
            $gameSwitches.setValue(28,true)
            console.log('樓層一樣');
        } else if ($gameVariables.value(21) > $gameVariables.value(26)) {
            $gameSwitches.setValue(26,true)
            if(!$gameSwitches.value(21)){
                while ($gameVariables.value(21) === $gameVariables.value(26)) {
                    $gameVariables.setValue(21,-1)
                    console.log($gameVariables.value(21));
                }
            }
            console.log('電梯會下樓');
        } else if ($gameVariables.value(21) < $gameVariables.value(26)) {
            $gameSwitches.setValue(25,true)
            if(!$gameSwitches.value(21)){
                while ($gameVariables.value(21) === $gameVariables.value(26)) {
                    $gameVariables.setValue(21,1)
                    console.log($gameVariables.value(21));
                }
            }
            console.log('電梯會上樓');
        }
    }
};

/*電梯內有人，別層有人按電梯，需要開門讓其他人上來
所以是 [只要有人按上下樓按鈕=>電梯的移動時間就要+id:043的總時間]、[電梯在無人的狀態會以一定速率移動到玩家樓層]
*/
