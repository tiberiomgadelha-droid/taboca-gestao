import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { C } from "../components/ui.jsx";
import { fmtCurrency } from "../utils/helpers.js";

const DashboardCharts = ({ metaProgress, pieData, receitaMes, meta }) => {
  return (
    <>
      <div style={{position:'relative',width:140,height:140,margin:'0 auto 16px'}}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={[{value:metaProgress},{value:100-metaProgress}]} cx="50%" cy="50%" innerRadius={45} outerRadius={65} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
              <Cell fill={metaProgress>80?C.green:metaProgress>40?C.amber:C.red}/>
              <Cell fill={C.borderLight}/>
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
          <div style={{fontSize:22,fontWeight:800,color:C.navy}}>{metaProgress}%</div>
          <div style={{fontSize:9,color:C.navyLight,fontWeight:600}}>DA META</div>
        </div>
      </div>
      <div style={{fontSize:11,color:C.navyLight,textAlign:'center',marginBottom:12}}>Meta {fmtCurrency(meta)}</div>
      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        {pieData.map(d=>(
          <div key={d.name} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:C.navyLight}}><div style={{width:8,height:8,borderRadius:4,background:d.color}}/>{d.name}</div>
            <span style={{fontSize:11,fontWeight:700,color:C.navy}}>{receitaMes>0?(d.value/receitaMes*100).toFixed(1)+'%':'0.0%'}</span>
          </div>
        ))}
      </div>
      {metaProgress>=100&&<div style={{marginTop:10,textAlign:'center',fontSize:11,color:C.green,fontWeight:700}}>🎉 Meta atingida! Parabéns!</div>}
    </>
  );
};

export default DashboardCharts;
