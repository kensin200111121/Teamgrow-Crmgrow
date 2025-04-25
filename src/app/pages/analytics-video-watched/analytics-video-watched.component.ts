import { SspaService } from '../../services/sspa.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-analytics-video-watched',
  templateUrl: './analytics-video-watched.component.html',
  styleUrls: ['./analytics-video-watched.component.scss']
})
export class AnalyticsVideoWatchedComponent implements OnInit {
  selectedWeekly = 0;
  weekly = ['2 WEEK BEFORE', '1 WEEK BEFORE', 'THIS WEEK'];
  selectedMonthly = 0;
  monthly = ['2 MONTH BEFORE', '1 MONTH BEFORE', 'THIS MONTH'];
  topExpanded = true;
  watchDataExpanded = [];

  colors = [
    {
      background: '#ffcc00',
      border: '#fff3c2'
    },
    {
      background: '#babbbe',
      border: '#ececec'
    },
    {
      background: '#f5325b',
      border: '#fdced8'
    },
    {
      background: '#00916e',
      border: '#c2e5dc'
    },
    {
      background: '#da20f2',
      border: '#f6f8fc'
    },
    {
      background: '#0000ff',
      border: '#c2c2ff'
    },
    {
      background: '#f26419',
      border: '#fcdac8'
    },
    {
      background: '#0d5c63',
      border: '#c5d8da'
    }
  ];
  colorCount = this.colors.length;

  watchData = [
    {
      priority: 1000,
      _id: '5f3d71adb7539e68dc3f5e52',
      url: 'https://www.youtube.com/watch?v=dGc5zn0HUbU&feature=youtu.be',
      type: 'youtube',
      title: 'eXp Realty vs. Keller Williams',
      description:
        '<h2>Company History</h2><h3>Keller Williams</h3><div>Let\'s start by comparing the two brokerages\' history.&nbsp;Keller Williams was founded in 1983 by Gary Keller and Joe Williams.&nbsp;The company started as an individual office located in Austin, Texas. It quickly grew to become the largest real estate firm in the Austin area with 72 licensed agents.&nbsp;Around 1985, the housing market experienced a nationwide housing bubble. It was at this time Keller Williams began offering "Profit Sharing" to retain agents and get through the recession.</div><div><br></div><div><img src="https://mlm3ymfxyqmt.i.optimole.com/apNXQ_k-3DC8TtfZ/w:700/h:467/q:90/https://www.kylehandy.com/wp-content/uploads/2020/04/austin-texas-keller-williams.jpg" height="467" width="700"></div><div><br></div><div>In the early 90\'s Keller Williams began offering&nbsp;<span style="color: rgb(238, 129, 65);">franchise</span>&nbsp;opportunities and opened their first location in Oklahoma.&nbsp;Continuing its growth across the country throughout the \'90s and into the 2000s, in 2004 Keller Williams had over 30,000 agents nationwide.&nbsp;In 2007 Keller Williams opened their luxury division and in 2008 their commercial division.&nbsp;&nbsp;</div><div>In 2010 Keller Williams had over 77,000 agents and became the 2nd largest brokerage.&nbsp;In 2012 Keller Williams went international, launching in Vietnam. That same year it opened offices in Germany, Austria, and the United Kingdom.</div><div>Today Keller Williams has just over 160,000 agents and accounts for around 10% of all homes sold in North America.</div><div><br></div><h3>eXp Realty</h3><div>eXp Realty, on the other hand, was founded in 2009 by a former KW team leader,&nbsp;<span style="color: rgb(238, 129, 65);">Glenn Sanford</span>.&nbsp;Glenn was a high producing team leader, doing over $80 million in volume though multiple expansion teams across the country.&nbsp;However, when the market turned in the housing collapse of 2008, Glenn was stuck with a ton of overhead, and it nearly caused him to go out of business.&nbsp;&nbsp;</div><div>Rather than give up, Glenn decided to create a new real estate brokerage.&nbsp;This real estate brokerage would not depend on brick and mortar offices and would instead support agents nationwide via a cloud office.&nbsp;This brokerage was eXp Realty the office would become eXp World.</div><div>Taking a page from Keller Williams, Glenn realized how important profit-sharing was to Keller Williams\' massive growth. Glenn created eXp Realty "Revenue sharing." There are some significant differences here that we will get into later on in the article.&nbsp;&nbsp;</div><div>In addition to&nbsp;<a href="https://www.kylehandy.com/blog/exp/exp-realty-revenue-share/" rel="noopener noreferrer" target="_blank" style="color: rgb(238, 129, 65);">revenue share</a>, Glenn took eXp Realty public in 2013 and created the agent-equity program where agents could earn publicly traded stock in the company for their sales production and attraction efforts.&nbsp;</div><div><br></div><div><img src="https://mlm3ymfxyqmt.i.optimole.com/apNXQ_k-DELSR5jM/w:700/h:467/q:90/https://www.kylehandy.com/wp-content/uploads/2020/04/exp-realty-growth-1.jpg" height="467" width="700"></div><div><br></div><div>In 2015, the company was growing steadily but was still under 1,000 agents nationwide. That was until in late-2015 eXp Realty attracted a couple of high-profile former Keller Williams agents, Gene Frederick and&nbsp;<span style="color: rgb(238, 129, 65);">Rob Flick</span>. Gene owned over 6 Keller Williams market centers, and Rob was one of Keller Williams\' top profit share earners of all time.</div><div>From 2016 to 2019, eXp Realty increased its agent count from 1,000 agents to over 20,000 agents and expanded it\'s footprint to all 50 US states and nearly all of Canada.&nbsp;It is the 2nd largest independent real estate brokerage as ranked by The Real Trends 500.&nbsp;</div><div>&nbsp;</div><h2>eXp Realty vs Keller Williams Business Model</h2><div>These two companies, although different in many ways, have a similar philosophy in that they put the real estate agent\'s needs first.&nbsp;&nbsp;</div><div>Keller Williams\' focus is on training and education, although they are increasing their stake to become a technology company. Keller Williams offers agents programs like Command for&nbsp;<a href="https://www.kylehandy.com/blog/learn/what-does-crm-mean-in-real-estate/" rel="noopener noreferrer" target="_blank" style="color: rgb(238, 129, 65);">CRM</a>&nbsp;and Kelle, a voice-activated AI personal assistant.&nbsp;&nbsp;</div><div>eXp Realty is also focused on training for agents, offering agents over 50 hours of live training weekly in its cloud-office and even more on-demand. Also, eXp Realty gives all agents first-class websites and CRM through&nbsp;<span style="color: rgb(238, 129, 65);">kvCORE</span>, a third-party tool that usually costs agents thousands per year.</div><div>In addition to the support options for agents, both companies offer agents additional income opportunities.&nbsp;As mentioned earlier, Keller Williams provides profit-sharing to its agents; eXp Realty provides revenue sharing.&nbsp;&nbsp;</div><div><br></div><div><img src="https://mlm3ymfxyqmt.i.optimole.com/apNXQ_k-kXCs8UN0/w:700/h:381/q:90/https://www.kylehandy.com/wp-content/uploads/2020/04/exp-realty-stock.jpg" height="381" width="700"></div><div><br></div><div>Additionally, eXp Realty offers agents stock for their production and attraction efforts.&nbsp;Keller Williams is privately held and does not provide stock ownership to its agents.</div><div>Keller Williams is a franchise model.&nbsp;It breaks up countries into regions, which sell franchises or "Market-centers" to individuals looking to open an office.</div><div>eXp Realty, on the other hand, is one&nbsp;<span style="color: rgb(238, 129, 65);">independent brokerage</span>&nbsp;with no territories, regions, or franchise locations. Agents and brokers have the opportunity to expand their business or attract agents from any area regardless of borders.&nbsp;Also, agents only pay one cap even if they hold licenses in multiple states.</div><div><br></div><h2>Revenue Share vs Profit Share</h2><div>One of the most discussed benefits of these two companies is the companies offering of residual income to agents that help grow the company. Keller Williams provides Profit Share, eXp Realty provides Revenue Share.&nbsp;To compare eXp Realty vs Keller Williams, agents need to understand the difference between the two.</div><div><br></div><h3>How It Works&nbsp;&nbsp;</h3><div>At the very basic level, revenue and profit share work like this. When an agent "Sponsors" another agent to their respective company, that agent then is rewarded with a percentage of that new agent\'s commission in perpetuity.&nbsp;&nbsp;</div><div>With Keller Williams, this percentage is based on the profit, AFTER overhead expenses, from the market center that the agent belongs.&nbsp;&nbsp;</div><div>With eXp Realty, the percentage is based on revenue, BEFORE expenses. Revenue share is a fixed-percentage and determined by multiplying the gross commission income times that levels percentage amount.</div><div><br></div><h3>Tiers</h3><div>Both companies have a seven-level model.&nbsp;Meaning that not only do you earn this share percentage of the agents you sponsor, but also that of the agents they sponsor down seven levels total.&nbsp;Each level offers a different amount.&nbsp;&nbsp;</div><div>With Keller Williams when an agent leaves that in your seven levels, all agents under that agent move up a level.&nbsp;With eXp Realty when an agent leaves, that position becomes a company spot, and all levels remain the same.</div><div><br></div><h3>The Big Picture</h3><div>Agents that have earned millions of dollars of Keller Williams profit share and now earn similar amounts of eXp Realty revenue share state the following. With the same number of agents in their organizations at eXp Realty and Keller Williams, they make between 6 to 10 times more at eXp Realty every month because of the difference between revenue-sharing (before expenses) and profit-sharing (after expenses).</div><div>For a detailed explanation of revenue share, check out the article I did here.</div><div><br></div><h2>Transactional and Monthly Fees</h2><div>When you compare the compensation plans of eXp Realty vs Keller Williams, you\'ll notice they have a similar structure. But one companies plan is much lower overall.</div><div><br></div><div><img src="https://mlm3ymfxyqmt.i.optimole.com/apNXQ_k-w1DSd3vs/w:700/h:465/q:90/https://www.kylehandy.com/wp-content/uploads/2020/04/exp-realty-vs-keller-williams-fees.jpg" height="465" width="700"></div><div><br></div><div>There is one thing to point out about each companies compensation plan before going into specific details. At Keller Williams, each market center is individually-owned. Therefore, compensation plans can vary from one office to another, especially in different states.&nbsp;At eXp Realty, all agents are on the same split regardless of state, length in the business, or production levels.</div><div><br></div><h3>Transactional Fees</h3><div>The majority of Keller Williams offices from agents that I have spoken to state the typical split is 70/30 with an $18,000 cap annually.&nbsp;However, this can range from $9,000 to $42,000 depending on location and market center. Additionally, agents typically pay a 6% per transaction royalty fee that goes to Keller Williams corporate and caps at $3,000 annually. There is an E&amp;O fee on every transaction that does not cap.&nbsp;It can range from around $40-75 depending on market center.&nbsp;&nbsp;</div><div><br></div><h4>Here are a couple quick examples:</h4><div>$10,000 Commission at Keller Williams</div><ul><li>Keller Williams keeps $3,675</li><li>The agent keeps $6,325</li></ul><div>At eXp Realty the&nbsp;<span style="color: rgb(238, 129, 65);">commission split</span>&nbsp;is a fixed 80/20 split with ,000 cap across the board.&nbsp;Additionally, agents pay a $25 broker review fee and $40 risk management fee on each transaction.&nbsp;The $40 risk management fee goes away after 12.5 transactions ($500) per year.&nbsp;&nbsp;</div><div>$10,000 Commission at eXp Realty</div><ul><li>eXp Realty keeps $2,065</li><li>The agent keeps $7,935</li></ul><div><br></div><h3>Monthly Fees</h3><div>The monthly fees at Keller Williams are around $60-80 per month in most market centers.&nbsp;eXp Realty\'s monthly fees are $85 per month in the US and $139 in Canada.&nbsp;&nbsp;</div><div><br></div><h2>New Agents at eXp Realty vs Keller Williams</h2><div>If you\'re a new agent and you are considering either Keller Williams vs. eXp Realty, then you\'ll want to consider the following.&nbsp;At both real estate brokerages, new agents will come on typically with a different commission split and offered unique training opportunities specific to new agents.</div><div><br></div><h3>Mentorship Split</h3><h4>Keller Williams</h4><div>Most brand new agents at Keller Williams are set up on a 60/40 split for their first $1 million in sales volume.&nbsp;Again, this can change for each market center at Keller Williams because they are all independently owned. However, from the agents I spoke with, this seemed to be a common theme.&nbsp;Do note the 6% royalty is on top of this split, so it\'s closer to 54/46 initially.&nbsp;</div><div>During this initial launch phase, agents are provided additional training and resources from the market center. Therefore the increased split is warranted.</div><div>Once the agent completes their first $1 million in sales volume, they are then moved over to the commission structure we discussed earlier.</div><div><br></div><h4>eXp Realty eXpand Mentor Program</h4><div>At eXp Realty, the eXpand Mentor program is set up to support agents who have not sold 3 or more transactions in the last 12 months.</div><div>The eXpand Mentor program assigns a LOCAL mentor to the agent.&nbsp;Most of the time, this means having someone in your exact market or within around 50 miles of you.</div><div><br></div><div><img src="https://mlm3ymfxyqmt.i.optimole.com/apNXQ_k-ajCLV-ML/w:700/h:467/q:90/https://www.kylehandy.com/wp-content/uploads/2020/04/mentorship.jpg" height="467" width="700"></div><div><br></div><div>The mentor is certified, based on their production, a certification class, and the mentor\'s willingness to join the mentor program.&nbsp;They are responsible for helping to guide you through those first few transactions and completing the additional eXpand Mentor classes.&nbsp;&nbsp;</div><div>Mentees are on a 60/40 split for their first three closed transactions then go back to the standard 80/20 split after graduating from the mentor program.</div><div><br></div><h3>Training at eXp Realty vs Keller Williams</h3><h4>Keller Williams</h4><div>Keller Williams has long been hailed the real estate industries leading training brokerage.&nbsp;In 2004 it created the&nbsp;<a href="https://amzn.to/2wteNxA" rel="noopener noreferrer" target="_blank" style="color: rgb(238, 129, 65);">Millionaire Real Estate Agent (MREA) book</a>. This book has become a sort of "Bible" for real estate agents.&nbsp;Since that time, Keller Williams has created various training classes like Ignite and Maps Coaching, including BOLD.&nbsp;&nbsp;</div><div>Ignite training is set up to launch agents in their first 90 days.&nbsp;The local market center typically teaches this class at predetermined times throughout the year.&nbsp;It is mostly a Keller Williams agent class but depending on the market center\'s team leader, other brokerage agents have been allowed to join.&nbsp;</div><div><br></div><div><img src="https://mlm3ymfxyqmt.i.optimole.com/apNXQ_k-MOiurRc0/w:700/h:467/q:90/https://www.kylehandy.com/wp-content/uploads/2020/04/keller-williams-training.jpg" alt="keller-williams-training" height="467" width="700"></div><div><br></div><div>Maps Coaching is additional training, and coaching agents can sign up for to help them take their business to the next level.&nbsp;This coaching typically comes at an additional cost to the agent. Maps Coaching offers five different types of coaching currently — Mastery, OnDemand, BOLD, Breakthrough, and Group. BOLD is one of the most common MAPS coaching groups.&nbsp;&nbsp;</div><div>Bold is designed to help real estate agents get over one of the hardest hurdles, which is prospecting.&nbsp;This class is for both new and seasoned agents. It will provide group accountability, scripts, training, and resources to increase your prospecting as an agent.</div><div><br></div><h3>eXp Realty</h3><div>As the more modern real estate brokerage on the scene, eXp Realty\'s training is continuously growing and evolving.&nbsp;eXp Realty hosts the majority of its training inside its cloud office, eXp World. Today, agents can attend nearly 50 hours of live training every week from the comfort of their own home.&nbsp;&nbsp;</div><div>eXp Realty\'s corporate trainers, top producing agents, and&nbsp;<span style="color: rgb(238, 129, 65);">team leaders</span>&nbsp;from around the country lead eXp Realty\'s weekly training.&nbsp;Some of the training is taught consistently every week, while others are one-time training focused on a particular topic.</div><div>A schedule is posted every Sunday evening with the full lineup of training to take place for the week.&nbsp;Agents can mark their calendars and plan to attend via their computer live in eXp World or listen in on-the-go via the eXp World mobile application.&nbsp;&nbsp;&nbsp;&nbsp;</div><div><br></div><h2>Teams at eXp Realty vs Keller Williams</h2><div>One of the next most common questions asked when agents compare eXp Realty vs Keller Williams is how do teams compare? The answer depends on a couple of factors discussed below.</div><div><br></div><div><img src="https://mlm3ymfxyqmt.i.optimole.com/apNXQ_k-VqU8nQ3p/w:700/h:467/q:90/https://www.kylehandy.com/wp-content/uploads/2020/04/exp-realty-teams.jpg" height="467" width="700"></div><h3><br></h3><h3>Keller Williams</h3><div>At Keller Williams, there are all sorts of different team fees, depending on when you joined the brokerage.&nbsp;&nbsp;</div><div>Some grandfathered Keller Williams team leaders have a structure where additional team agents do not add to their cap.</div><div>Today most new agents and team leaders pay their $18,000 cap plus each team agent adds $4,500 to the team leaders cap.</div><div>All of the team\'s production goes towards paying the team cap at 70/30.&nbsp;</div><div>Once the team reaches the cap, it earns 100% of the gross commission income for the remainder of the year.&nbsp;&nbsp;</div><div>The team leader can set whatever split they wish with their agents before and after capping.</div><div><br></div><h3>eXp Realty</h3><div>At eXp Realty, there are 3 spelled out team models and a separate team for married couples called the "Domestic Team." I\'ll detail each below:</div><div><br></div><h4>Self-organized Team</h4><div>Team agents are eligible for the ICON stock award as well as all other eXp stock awards and revenue share programs.</div><div>The team leader does not need to meet any previous production benchmarks for this type of team.</div><div>Set up like a referral relationship with agents. All team agents have their own $16,000 cap (as does the team leader). Agreed upon deals are split with team leader first, then eXp second.</div><div><br></div><div><strong>Example:</strong>&nbsp;$10,000 commission on a 50/50 split to team leader. $5,000 to team leader, $5,000 to the agent. Then 80/20 to eXp Realty. $4,000 to team leader, $4,000 to the agent. If either the team leader or agent was already capped, then that person would earn 100% of their commission. In this example, $1,000 would go to the team agents\' $16,000 cap.</div><div><br></div><h4>Standard Team</h4><div>Team agents are on a ½ cap ($8,000). This $8,000 does not add to the team leaders $16,000 cap. Minimum of 25% of EVERY team agent\'s deals, written in that team agent\'s name, has to be split to the team leader.</div><div>Team agents are not eligible for the ICON stock award but can earn&nbsp;<span style="color: rgb(238, 129, 65);">eXp Realty stock</span>&nbsp;and revenue share.</div><div>The team leader must have closed a minimum of $6 million or 30 transactions in the previous 12 months.</div><div>Agreed upon deals are split with team leader first, then eXp second.</div><div><br></div><div><strong>Example:</strong>&nbsp;$10,000 commission on a 75/25 split to team leader. $2,500 to team leader, $7,500 to the agent. Then 80/20 to eXp Realty. $2,000 to team leader, $6,000 to agent. If either the team leader or agent was capped before the transaction, then that person would earn 100% of their side of the split. In this example, $1,500 would go towards the team agents\' $8,000 yearly cap.&nbsp;&nbsp;</div><div><br></div><h4>Mega ICON Team</h4><div>Same as Standard team above except the following:</div><div>All team agents are on ¼ caps ($4,000)</div><div>The team leader must have closed a minimum of $40 million, 175 transactions, and had ten capping team members in the previous 12 months</div><div><br></div><h4>Domestic Team</h4><div>Legally married couples are eligible</div><div>One $149 join fee and $85 monthly fee</div><div>One shared commission cap of $16,000</div><div>Both couples produce toward one cap and can earn one ICON award for the couple</div><div>Share one line of revenue share</div><div><br></div><h2>Offices at eXp Realty vs Keller Williams</h2><div><br></div><div>One of the critical differences between eXp Realty vs Keller Williams is having physical brick and mortar offices.</div><div>Agents at Keller Williams receive access to that market centers shared workspaces. Additionally, they can purchase private office space at an additional monthly expense. This expense ranges from a few hundred dollars a month to thousands of dollars in higher-cost markets.</div><div>The majority of training and support takes place within the physical office at Keller Williams, meaning that agents travel to and from the office to take care of business.</div><div>At eXp Realty, there are no physical brick and mortar offices.&nbsp;Agents receive Regus memberships where they can access the shared workspaces in over 3000 locations, 900 cities, and 120 countries.&nbsp;&nbsp;</div><div><br></div><div><img src="https://mlm3ymfxyqmt.i.optimole.com/apNXQ_k-wXP0O3sQ/w:700/h:467/q:90/https://www.kylehandy.com/wp-content/uploads/2020/04/exp-realty-vs-keller-williams-office.jpg" height="467" width="700"></div><div><br></div><div>Additionally, eXp agents can purchase private offices from Regus at a reduced rate due to this membership that is already provided by eXp Realty.&nbsp;Private offices are dependent upon the market and size of office preferred and range from around $500/month to a couple thousand a month.</div><div>Alternatively, agents can rent private offices from Regus for around $30-50 per hour to meet clients or work from privately.&nbsp;Many eXp agents also take advantage of lenders, title companies, and local coffee shops for office space.</div><div>At eXp Realty, training and support take place in eXp Realty\'s virtual office, eXp World.&nbsp;Over 500 eXp staff members are available to agents 11 hours a day in real-time from the convenience of the agent\'s own home or wherever they are at with an internet connection.&nbsp;</div><div><br></div><h2>Retirement Plan (Stock Purchase Program)</h2><div>The thought of retiring as a real estate agent is most often just that, a thought.&nbsp;When you ask most agents and brokers what their exit strategy is from real estate, you\'ll either get a dream or a goal but not a plan.</div><div>eXp Realty is publicly-traded on the NASDAQ stock exchange and offers agents and brokers equity ownership in the company for production and attraction milestones.&nbsp;Over time, agents acquire more and more ownership and start to build a portfolio of EXPI stock that can later be sold and used for several things, including&nbsp;<span style="color: rgb(238, 129, 65);">retirement</span>.</div><div><br></div><div><img src="https://mlm3ymfxyqmt.i.optimole.com/apNXQ_k-iQ3swKqf/w:700/h:526/q:90/https://www.kylehandy.com/wp-content/uploads/2020/04/exp-realty-retirement.jpg" height="526" width="700"></div><div><br></div><div>For example, I\'ve been an agent at eXp Realty for just over two years (as of July 2019) and have acquired over 10,000 shares of EXPI stock for my production and attraction efforts.&nbsp;I sell roughly 50 homes annually ($15 million volume) and have been an ICON agent at eXp Realty both years I\'ve been here.&nbsp;&nbsp;</div><div><br></div><h3>ICON Program</h3><div>Agents that cap ($80,000 gross commission income) and pay an additional $5,000 in capped transaction fees (20 transactions at $250/transaction) each year are eligible to become ICON agents.&nbsp;&nbsp;</div><div>Here in&nbsp;<span style="color: rgb(238, 129, 65);">San Antonio</span>, Texas, that is roughly 32 transactions per year.&nbsp;My average commission is around $7,000, so it takes 12 transactions to cap, then an additional 20 to become an ICON.&nbsp;&nbsp;</div><div>As an ICON agent, eXp Realty gives you back the $16,000 that you paid in for your cap in the form of EXPI stock at its current price.&nbsp;&nbsp;</div><div><br></div><h2>Culture &amp; Community</h2><div>I believe that to understand the culture of a company, and in being able to compare that of eXp Realty vs Keller Williams, you need to have experienced them first hand. I have only been apart of the eXp Realty culture, so I can only mainly speak of this experience. However, I will share my outsider\'s perspective of what I know to be true of the current Keller Williams agents I know.</div><div><br></div><h3>eXp Realty</h3><div>One unique element that shapes the culture of eXp Realty is the commitment to "One for all, and all for one."&nbsp;Because eXp Realty is a publicly held company and the majority of agents own a stake in the company, the collaboration among fellow agents is unlike any other real estate brokerage.&nbsp;eXp agents know that the better the company does as a whole, the better the share price will be, and their financial interests increase. This shared interest leads to eXp Realty\'s top agents, ICON agents, giving back in the form of training, and helping the newer agents succeed.&nbsp;&nbsp;</div><div>eXp Realty holds two signature events each year,&nbsp;<span style="color: rgb(238, 129, 65);">EXPCON</span>&nbsp;and the Shareholder Summit. Thousands of agents, along with staff and leadership, come together to attend these events. In the general sessions, agents receive training, networking opportunities, and upcoming news about the company.</div><div><br></div><h3>Keller Williams</h3><div>A sense of family is one of Keller Williams\' key cultural aspects.&nbsp;Keller Williams agents create long-lasting relationships with fellow agents within the company that transpires business alone.</div><div>Because the financial incentive isn\'t as straight forward as eXp Realty\'s stock award program, creating a culture where agents look out for one another is challenging. I would say Gary Keller has done an excellent job of incentivizing the right agents to help lead their collective groups within Keller Williams.&nbsp;Most agents I know at Keller Williams are happy to be there and love the brand and leadership even though the financial benefits are a little more limited.&nbsp;&nbsp;</div><div>Keller Williams holds two major events each year - MegaCamp and Family Reunion. These are massive events with tens of thousands of agents in attendance.&nbsp;Similar to eXp Realty, they host training sessions, breakout sessions, and talk about upcoming changes with the brokerage, and much more.&nbsp;&nbsp;</div>',
      thumbnail: 'https://i.ytimg.com/vi/dGc5zn0HUbU/mqdefault.jpg',
      duration: 980000,
      preview:
        'https://teamgrow.s3.us-east-2.amazonaws.com/preview120/7/3182c620-e24b-11ea-82bc-83c3bb1c96b2',
      user: '5e9a0285efb6b2a3449245da',
      created_at: '2020-08-19T18:38:37.016Z',
      updated_at: '2020-11-12T06:35:36.728Z',
      watches: [
        {
          first_name: 'Przemyslaw',
          last_name: 'Nowakowski',
          last_session: '2020-08-19T18:38:37.016Z',
          progress: '80',
          picture_profile:
            'https://teamgrow.s3.us-east-2.amazonaws.com/profile120/3/c2183c80-72a5-11ea-8060-69a5f7af2b63.jpeg'
        },
        {
          first_name: 'Thomas',
          last_name: 'Anderson',
          last_session: '2020-11-12T06:35:36.728Z',
          progress: '80',
          picture_profile: ''
        },
        {
          first_name: 'Rafal',
          last_name: 'Baran',
          last_session: '2020-11-12T06:35:36.728Z',
          progress: '100'
        },
        {
          first_name: 'Nick',
          last_name: 'Carter',
          last_session: '2020-11-12T06:35:36.728Z',
          progress: '60'
        }
      ]
    },
    {
      _id: '5fac5750bb27a737badbfbf7',
      url: 'https://www.youtube.com/watch?v=JeFqM7hxNVg',
      type: 'youtube',
      title: 'Electric trucks',
      description: '<div>Are the future!</div>',
      thumbnail: 'https://i.ytimg.com/vi/JeFqM7hxNVg/mqdefault.jpg',
      duration: 1084000,
      preview:
        'https://teamgrow.s3.us-east-2.amazonaws.com/preview120/10/bc7d2620-2464-11eb-99b2-111f6b33e18c',
      user: '5e9a0285efb6b2a3449245da',
      created_at: '2020-11-11T21:27:44.364Z',
      updated_at: '2020-11-11T21:45:02.386Z',
      watches: [
        {
          first_name: 'Przemyslaw',
          last_name: 'Nowakowski',
          last_session: '2020-08-19T18:38:37.016Z',
          progress: '80'
        },
        {
          first_name: 'Thomas',
          last_name: 'Anderson',
          last_session: '2020-11-12T06:35:36.728Z',
          progress: '80',
          picture_profile:
            'https://teamgrow.s3.us-east-2.amazonaws.com/profile120/4/5e923c70-a102-11ea-a0ee-81f2c01ef470.jpeg'

        },
        {
          first_name: 'Rafal',
          last_name: 'Baran',
          last_session: '2020-11-12T06:35:36.728Z',
          progress: '100'
        },
        {
          first_name: 'Nick',
          last_name: 'Carter',
          last_session: '2020-11-12T06:35:36.728Z',
          progress: '60'
        }
      ]
    },
    {
      _id: '5fc1693a871fd3384d9e95ed',
      type: 'application/pdf',
      url:
        'https://teamgrow.s3.us-east-2.amazonaws.com/pdf+119/10/U.S.+%E2%80%93%C2%A0Spanish+%E2%80%93%C2%A0Introducci%C3%B3n+a+eXp+Realty.pdf',
      description:
        'Resumen detallado de la presentación sobre por qué eXp es uno de los corredores de bienes raíces de más rápido crecimiento a nivel mundial',
      preview:
        'https://teamgrow.s3.us-east-2.amazonaws.com/preview120/10/c2697750-30f3-11eb-8fd9-8dfdd4d20e67',
      title: 'Introducción a eXp Realty Presentación',
      updated_at: '2019-11-01T18:59:58.898Z',
      user: '5e9a0285efb6b2a3449245da',
      default_pdf: '5dd43bae3abf222a0368a46b',
      watches: [
        {
          first_name: 'Rafal',
          last_name: 'Baran',
          last_session: '2020-11-12T06:35:36.728Z',
          progress: '100',
          picture_profile:
            'https://teamgrow.s3.us-east-2.amazonaws.com/profile120/4/5e923c70-a102-11ea-a0ee-81f2c01ef470.jpeg'
        },
        {
          first_name: 'Nick',
          last_name: 'Carter',
          last_session: '2020-11-12T06:35:36.728Z',
          progress: '60'
        }
      ]
    },
    {
      url: [
        'https://teamgrow.s3.us-east-2.amazonaws.com/image%20120/4/02.jpg',
        'https://teamgrow.s3.us-east-2.amazonaws.com/image%20120/4/2017-lindauer-install-6.jpg',
        'https://teamgrow.s3.us-east-2.amazonaws.com/image%20120/4/1489734230870-4a20b80c31d1f56bedfa9a75ad817cc9.jpeg',
        'https://teamgrow.s3.us-east-2.amazonaws.com/image%20120/4/Art-PLATUX-modern-art-photo-online-gallery-fine-art-prints-contemporary-arts.jpg',
        'https://teamgrow.s3.us-east-2.amazonaws.com/image%20120/4/ca8f7d250ce7e6a8a8e8c62c24114c6c.jpg',
        'https://teamgrow.s3.us-east-2.amazonaws.com/image%20120/4/IMG-20170906-WA0002.webp',
        'https://teamgrow.s3.us-east-2.amazonaws.com/image%20120/4/real_3.jpg',
        'https://teamgrow.s3.us-east-2.amazonaws.com/image%20120/4/simple-house-model-design-new-design-simple-house-mesmerizing-decor-inspiration-house-gallery-designs-with-photos-simple-house-designs-image-design-ideas-for-small-bathroom-on-a-budget.jpg',
        'https://teamgrow.s3.us-east-2.amazonaws.com/image%20120/4/standard.jpg',
        'https://teamgrow.s3.us-east-2.amazonaws.com/image%20120/4/su17rvberlin2-hr-v2.jpg',
        'https://teamgrow.s3.us-east-2.amazonaws.com/image%20120/4/unnamed.jpg'
      ],
      del: false,
      _id: '5ebdd0adea1bb233ff38e6e7',
      user: '5e9a0285efb6b2a3449245da',
      type: 'image/jpeg',
      role: 'team',
      description: 'This is a test gallery for the QA. Please check',
      preview:
        'https://app.crmgrow.com/api/image/preview/920a1250-9638-11ea-b6f4-2b399ee6d193.jpg',
      title: 'Real Estate Images',
      updated_at: '2020-07-31T17:42:19.956Z',
      watches: [
        {
          first_name: 'Przemyslaw',
          last_name: 'Nowakowski',
          last_session: '2020-08-19T18:38:37.016Z',
          progress: '80'
        },
        {
          first_name: 'Thomas',
          last_name: 'Anderson',
          last_session: '2020-11-12T06:35:36.728Z',
          progress: '80'
        },
        {
          first_name: 'Rafal',
          last_name: 'Baran',
          last_session: '2020-11-12T06:35:36.728Z',
          progress: '100'
        }
      ]
    }
  ];

  constructor(
    public sspaService: SspaService
  ) {}

  ngOnInit(): void {
    for(let i = 0; i < this.watchData.length; i++) {
      this.watchDataExpanded.push(false);
    }
  }

  beforeWeek(): void {
    this.selectedWeekly--;
  }

  nextWeek(): void {
    this.selectedWeekly++;
  }

  beforeMonth(): void {
    this.selectedMonthly--;
  }

  nextMonth(): void {
    this.selectedMonthly++;
  }

  changeExpanded(): void {
    this.topExpanded = !this.topExpanded;
  }

  changeDataExpanded(row): void {
    this.watchDataExpanded[row] = !this.watchDataExpanded[row];
  }

  getMaterialType(material): any {
    if (material.type) {
      if (material.type === 'application/pdf') {
        return 'PDF';
      } else if (material.type.includes('image')) {
        return 'Image';
      }
    }
    return 'Video';
  }

  getAvatarName(contact): any {
    if (contact.first_name && contact.last_name) {
      return contact.first_name[0] + contact.last_name[0];
    } else if (contact.first_name && !contact.last_name) {
      return contact.first_name[0];
    } else if (!contact.first_name && contact.last_name) {
      return contact.last_name[0];
    }
    return 'UC';
  }
}
