### 普通规则
> zip具备文件和文件夹两种特性
> SZ,TZ 视为文件不遍历
> SZD TZD视为文件夹即遍历其中的文件
> 
1. cover

| cover     | SF（原文件） | SD（原文件夹） |  SZ（原zip） |
|:---------:|:-------:|:--------:|:---------:|
| TF（目标文件）  | SF      | SD       | SZ        |
| TD（目标文件夹） | SF      | SD       | SZ（SZD）         |
| TZ（目标zip） | SF      | SD（TZD）| SZ（SZD TZD）       |
| E（空）      | SF      | SD       | SZ        |


2. increment

| incremnt  | SF（原文件） | SD（原文件夹） | SZ（原zip）    |
|-----------|---------|----------|-------------|
| TF（目标文件）  | TF      | TF       | TF          |
| TD（目标文件夹） | TD      | TD       | TD（SZD）     |
| TZ（目标zip） | TZ  | TZ （TZD） | TZ（SZD TZD） |
| E（空）      | SF      | SD       | SZ          |


3. update

| update    | SF（原文件）    | SD（原文件夹） | SZ（原zip）    |
|-----------|------------|----------|-------------|
| TF（目标文件）  | SF         | TF       | SZ          |
| TD（目标文件夹） | TD         | SD       | TD（SZD）     |
| TZ（目标zip） | 1.TZ 2.SF | SD（TZD）  | SZ（TZD SZD） |
| E（空）      | E          | E        | E           |

4. incrementUpdate

| incrementUpdate | SF（原文件）   | SD（原文件夹） |  SZ（原zip）    |
|-----------------|-----------|----------|--------------|
| TF（目标文件）        | SF        | TF       | SZ           |
| TD（目标文件夹）       | TD        | SD       | TD（SZD）      |
| TZ（目标zip）       | 1.TZ 2.SF | SD（TZD）  |  SZ（TZD SZD） |
| E（空）            | SF        | SD       | SZ           |
