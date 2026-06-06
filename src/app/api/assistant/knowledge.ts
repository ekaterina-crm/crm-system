import { clothingKnowledge } from "./knowledge/clothing";
import { shoesKnowledge } from "./knowledge/shoes";
import { waterKnowledge } from "./knowledge/water";
import { dairyKnowledge } from "./knowledge/dairy";
import { cosmeticsKnowledge } from "./knowledge/cosmetics";
import { tiresKnowledge } from "./knowledge/tires";
import { toysKnowledge } from "./knowledge/toys";
import { electronicsKnowledge } from "./knowledge/electronics";

export const honestSignKnowledge = `
Честный Знак — государственная система цифровой маркировки и прослеживания товаров.

Основные темы:
- регистрация участника оборота;
- описание товаров в Национальном каталоге;
- получение GTIN;
- заказ кодов маркировки;
- нанесение Data Matrix;
- ввод товаров в оборот;
- передача сведений через ЭДО;
- вывод товаров из оборота;
- проверка кодов маркировки.

Товарные группы:

${clothingKnowledge}

${shoesKnowledge}

${waterKnowledge}

${dairyKnowledge}

${cosmeticsKnowledge}

${tiresKnowledge}

${toysKnowledge}

${electronicsKnowledge}
`;