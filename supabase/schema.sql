-- Gan Maison · vouchers do "segredo do jardim"
-- Rode este arquivo inteiro no SQL Editor do Supabase. Pode rodar de novo sem perder dados.
--
-- Quem pode o quê:
--   visitante (anon)  → só chama vouchers_status() e gerar_voucher(); não lê a tabela
--   recepção (login)  → lê a lista e marca/desmarca "usado"; e-mail precisa estar em recepcao_usuarios

-- ───────── Tabelas ─────────
create table if not exists public.vouchers (
  id bigint generated always as identity primary key,
  -- GAN- + 6 caracteres sem os que se confundem (sem 0/O, 1/I)
  codigo text not null unique check (codigo ~ '^GAN-[2-9A-HJ-NP-Z]{6}$'),
  nome text not null check (char_length(nome) between 2 and 80),
  -- só dígitos, DDD + celular: 61999791090
  telefone text not null unique check (telefone ~ '^[1-9][1-9]9[0-9]{8}$'),
  criado_em timestamptz not null default now(),
  usado_em timestamptz
);

create table if not exists public.recepcao_usuarios (
  email text primary key
);

alter table public.vouchers enable row level security;
alter table public.recepcao_usuarios enable row level security;

-- o Supabase dá acesso às tabelas novas para anon/authenticated por padrão; aqui fica só o necessário
revoke all on public.vouchers from anon, authenticated;
revoke all on public.recepcao_usuarios from anon, authenticated;
grant select on public.vouchers to authenticated;
grant update (usado_em) on public.vouchers to authenticated;

-- ───────── Limite de vouchers (troque o 100 aqui para mudar) ─────────
create or replace function public.voucher_limite() returns int
language sql immutable as $$ select 100 $$;

-- ───────── Recepção ─────────
-- pega o e-mail da conta logada em auth.users (pelo id do token) e compara sem espaços nem maiúsculas
create or replace function public.is_recepcao() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from auth.users u
    join recepcao_usuarios r on lower(btrim(r.email)) = lower(btrim(u.email))
    where u.id = auth.uid()
  );
$$;

drop policy if exists "recepcao le vouchers" on public.vouchers;
create policy "recepcao le vouchers" on public.vouchers
  for select to authenticated using (public.is_recepcao());

drop policy if exists "recepcao marca uso" on public.vouchers;
create policy "recepcao marca uso" on public.vouchers
  for update to authenticated using (public.is_recepcao()) with check (public.is_recepcao());

-- ───────── Página pública ─────────
create or replace function public.vouchers_status() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'limite', voucher_limite(),
    'esgotado', (select count(*) from vouchers) >= voucher_limite()
  );
$$;

/**
 * Gera o voucher. Respostas:
 *   { status: 'ok', codigo, nome }
 *   { status: 'ja_cadastrado' }  telefone já tem cupom (não devolve o código)
 *   { status: 'esgotado' }
 *   { status: 'invalido', campo: 'nome' | 'telefone' }
 */
create or replace function public.gerar_voucher(p_nome text, p_telefone text) returns json
language plpgsql volatile security definer set search_path = public as $$
declare
  v_nome text := regexp_replace(btrim(coalesce(p_nome, '')), '\s+', ' ', 'g');
  v_tel text := regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g');
  v_alfabeto constant text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  v_codigo text;
begin
  if length(v_tel) = 13 and left(v_tel, 2) = '55' then
    v_tel := substr(v_tel, 3);
  end if;
  if char_length(v_nome) < 2 or char_length(v_nome) > 80 then
    return json_build_object('status', 'invalido', 'campo', 'nome');
  end if;
  if v_tel !~ '^[1-9][1-9]9[0-9]{8}$' then
    return json_build_object('status', 'invalido', 'campo', 'telefone');
  end if;

  -- um envio por vez: dois acessos simultâneos não furam o limite nem duplicam o telefone
  perform pg_advisory_xact_lock(hashtext('gan_vouchers'));

  -- telefone que já tem cupom: só avisa (o código nunca é mostrado de novo; a pessoa fala com a loja no WhatsApp)
  if exists (select 1 from vouchers where telefone = v_tel) then
    return json_build_object('status', 'ja_cadastrado');
  end if;

  if (select count(*) from vouchers) >= voucher_limite() then
    return json_build_object('status', 'esgotado');
  end if;

  loop
    v_codigo := 'GAN-';
    for i in 1..6 loop
      v_codigo := v_codigo || substr(v_alfabeto, 1 + floor(random() * 32)::int, 1);
    end loop;
    exit when not exists (select 1 from vouchers where codigo = v_codigo);
  end loop;

  insert into vouchers (codigo, nome, telefone) values (v_codigo, v_nome, v_tel);
  return json_build_object('status', 'ok', 'codigo', v_codigo, 'nome', v_nome);
end;
$$;

-- o Supabase libera funções novas para anon/authenticated por padrão; fecha tudo e abre só o necessário
revoke all on function public.voucher_limite() from public, anon, authenticated;
revoke all on function public.is_recepcao() from public, anon;
revoke all on function public.vouchers_status() from public;
revoke all on function public.gerar_voucher(text, text) from public;
grant execute on function public.is_recepcao() to authenticated;
grant execute on function public.vouchers_status() to anon, authenticated;
grant execute on function public.gerar_voucher(text, text) to anon, authenticated;

-- ───────── Conta da recepção ─────────
-- 1. Authentication → Users → Add user → Create new user
--    e-mail: gan@ganmaison.com.br · senha: a combinada · marque "Auto Confirm User"
--    (na tela de login da recepção basta digitar "gan" — o resto do e-mail é completado)
-- 2. Esta linha libera esse e-mail para ver a lista:
insert into public.recepcao_usuarios (email) values ('gan@ganmaison.com.br') on conflict do nothing;
