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

function elevatormove(elevatorname) {
    if(elevatorname === 'A'){
        if($gameVariables.value(21) === $gameVariables.value(26)){
            console.log('樓層一樣');
        }else if ($gameVariables.value(21) > $gameVariables.value(26)) {
            console.log('下樓');
        }else if($gameVariables.value(21) < $gameVariables.value(26)){
            console.log('上樓');
        }
    }else{

    }
}